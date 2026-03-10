import { NextFunction, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { ApiResponse, AuthenticatedRequest } from "../types";
import {
    createElectricityPaymentSchema,
    electricityPaymentQuerySchema,
} from "../validators/electricity-payment.validator";

const SETTLED_PAYMENT_STATUSES: Array<"paid"> = ["paid"];

const paymentListInclude = {
    bill: {
        select: {
            id: true,
            status: true,
            total_amount: true,
            currency: true,
            billing_period_start: true,
            billing_period_end: true,
            subscriber: {
                select: {
                    id: true,
                    subscription_number: true,
                    client: {
                        select: {
                            id: true,
                            full_name: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
            },
            meter: {
                select: {
                    id: true,
                    meter_number: true,
                },
            },
        },
    },
    receiver: {
        select: {
            id: true,
            full_name: true,
        },
    },
} as const;

type PaymentListPayload = Prisma.bill_paymentsGetPayload<{ include: typeof paymentListInclude }>;

function toNumber(value: unknown): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
}

function formatDateOnly(value: Date | null | undefined): string | null {
    if (!value) return null;
    return value.toISOString().slice(0, 10);
}

function parseDateOnly(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
}

function parseMonthStart(month: string): Date {
    return new Date(`${month}-01T00:00:00.000Z`);
}

function pad2(value: number): string {
    return String(value).padStart(2, "0");
}

function normalizeOptionalText(
    value: string | undefined | null
): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function buildReceiptNumberCandidate(now = new Date()): string {
    const year = now.getUTCFullYear();
    const month = pad2(now.getUTCMonth() + 1);
    const day = pad2(now.getUTCDate());
    const hours = pad2(now.getUTCHours());
    const minutes = pad2(now.getUTCMinutes());
    const seconds = pad2(now.getUTCSeconds());
    const randomSuffix = String(Math.floor(Math.random() * 1000)).padStart(3, "0");

    return `EBP-${year}${month}${day}-${hours}${minutes}${seconds}-${randomSuffix}`;
}

function mapPaymentListItem(payment: PaymentListPayload) {
    return {
        id: payment.id,
        bill_id: payment.bill_id,
        meter_id: payment.bill.meter.id,
        meter_number: payment.bill.meter.meter_number,
        subscriber_id: payment.bill.subscriber.id,
        subscriber_name: payment.bill.subscriber.client.full_name,
        subscription_number: payment.bill.subscriber.subscription_number,
        amount: toNumber(payment.amount),
        currency: payment.currency,
        payment_date: formatDateOnly(payment.payment_date),
        status: payment.status,
        payment_method: payment.payment_method,
        collector_id: payment.received_by,
        collector_name: payment.receiver?.full_name ?? null,
        receipt_number: payment.receipt_number,
        notes: payment.notes,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        bill: {
            id: payment.bill.id,
            status: payment.bill.status,
            total_amount: toNumber(payment.bill.total_amount),
            currency: payment.bill.currency,
            billing_period_start: formatDateOnly(payment.bill.billing_period_start),
            billing_period_end: formatDateOnly(payment.bill.billing_period_end),
        },
    };
}

async function ensureCollectorExists(employeeId: string): Promise<void> {
    const employee = await prisma.employees.findFirst({
        where: {
            id: employeeId,
            deleted_at: null,
            is_active: true,
        },
        select: { id: true },
    });

    if (employee) return;

    const error = new Error("Collector employee not found") as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
}

async function ensureUniqueReceiptNumber(
    receiptNumber: string
): Promise<boolean> {
    const existing = await prisma.bill_payments.findFirst({
        where: {
            deleted_at: null,
            receipt_number: receiptNumber,
        },
        select: { id: true },
    });

    return !existing;
}

async function generateUniqueReceiptNumber(): Promise<string> {
    for (let attempt = 0; attempt < 25; attempt += 1) {
        const candidate = buildReceiptNumberCandidate();
        const isUnique = await ensureUniqueReceiptNumber(candidate);
        if (isUnique) return candidate;
    }

    throw new Error("Failed to generate a unique receipt number");
}

async function getSettledPaidAmountForBill(billId: string): Promise<number> {
    const aggregate = await prisma.bill_payments.aggregate({
        where: {
            bill_id: billId,
            deleted_at: null,
            status: { in: SETTLED_PAYMENT_STATUSES },
        },
        _sum: {
            amount: true,
        },
    });

    return toNumber(aggregate._sum?.amount);
}

async function refreshBillStatusAfterPayment(billId: string): Promise<void> {
    const bill = await prisma.bills.findFirst({
        where: { id: billId, deleted_at: null },
        select: {
            id: true,
            total_amount: true,
        },
    });

    if (!bill) return;

    const paidAmount = await getSettledPaidAmountForBill(billId);
    const totalAmount = toNumber(bill.total_amount);

    let nextStatus: "pending" | "paid" = "pending";
    if (paidAmount >= totalAmount && totalAmount > 0) {
        nextStatus = "paid";
    }

    await prisma.bills.update({
        where: { id: billId },
        data: {
            status: nextStatus,
        },
    });
}

/**
 * GET /api/bill-payments
 * Electricity bill payments with pagination + summary.
 */
export const getElectricityPayments = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = electricityPaymentQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Invalid query params",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { page, limit, search, status, month, subscriber_id, bill_id } = parsed.data;
        const skip = (page - 1) * limit;

        const billWhere: Prisma.billsWhereInput = {
            deleted_at: null,
            subscriber: { deleted_at: null },
            meter: { deleted_at: null },
        };

        if (subscriber_id) {
            billWhere.subscriber_id = subscriber_id;
        }

        const where: Prisma.bill_paymentsWhereInput = {
            deleted_at: null,
            bill: billWhere,
        };

        if (status) {
            where.status = status;
        }

        if (month) {
            const start = parseMonthStart(month);
            const end = new Date(start);
            end.setUTCMonth(end.getUTCMonth() + 1);
            where.payment_date = {
                gte: start,
                lt: end,
            };
        }

        if (bill_id) {
            where.bill_id = bill_id;
        }

        if (search) {
            where.OR = [
                {
                    receipt_number: {
                        contains: search,
                        mode: "insensitive" as Prisma.QueryMode,
                    },
                },
                {
                    bill: {
                        meter: {
                            meter_number: {
                                contains: search,
                                mode: "insensitive" as Prisma.QueryMode,
                            },
                        },
                    },
                },
                {
                    bill: {
                        subscriber: {
                            subscription_number: {
                                contains: search,
                                mode: "insensitive" as Prisma.QueryMode,
                            },
                        },
                    },
                },
                {
                    bill: {
                        subscriber: {
                            client: {
                                full_name: {
                                    contains: search,
                                    mode: "insensitive" as Prisma.QueryMode,
                                },
                            },
                        },
                    },
                },
            ];
        }

        const [payments, total, collectedAgg, totalPayments] = await Promise.all([
            prisma.bill_payments.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ payment_date: "desc" }, { created_at: "desc" }],
                include: paymentListInclude,
            }),
            prisma.bill_payments.count({ where }),
            prisma.bill_payments.aggregate({
                where: {
                    deleted_at: null,
                    status: { in: SETTLED_PAYMENT_STATUSES },
                },
                _sum: { amount: true },
            }),
            prisma.bill_payments.count({
                where: { deleted_at: null },
            }),
        ]);

        res.json({
            success: true,
            data: {
                items: payments.map((payment) => mapPaymentListItem(payment)),
                pagination: {
                    page,
                    limit,
                    total,
                    total_pages: Math.ceil(total / limit),
                },
                summary: {
                    total_collected: toNumber(collectedAgg._sum?.amount),
                    total_payments: totalPayments,
                },
            },
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/bill-payments
 * Register a payment against an electricity bill.
 */
export const createElectricityPayment = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = createElectricityPaymentSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const data = parsed.data;
        const bill = await prisma.bills.findFirst({
            where: {
                id: data.bill_id,
                deleted_at: null,
                subscriber: { deleted_at: null },
                meter: { deleted_at: null },
            },
            select: {
                id: true,
                status: true,
                total_amount: true,
            },
        });

        if (!bill) {
            res.status(404).json({ success: false, error: "Bill not found" });
            return;
        }

        const normalizedReceipt = normalizeOptionalText(data.receipt_number);
        let receiptNumber = normalizedReceipt ?? null;

        if (receiptNumber) {
            const isUnique = await ensureUniqueReceiptNumber(receiptNumber);
            if (!isUnique) {
                res.status(409).json({ success: false, error: "Receipt number already exists" });
                return;
            }
        }

        const isSettled = data.status === "paid";
        const paidAmount = await getSettledPaidAmountForBill(bill.id);
        const totalAmount = toNumber(bill.total_amount);
        const outstanding = Math.max(0, totalAmount - paidAmount);

        if (isSettled && outstanding <= 0) {
            res.status(409).json({ success: false, error: "This bill is already fully paid" });
            return;
        }

        if (isSettled && data.amount > outstanding) {
            res.status(400).json({
                success: false,
                error: `Payment exceeds outstanding amount (${outstanding.toFixed(2)})`,
            });
            return;
        }

        if (!receiptNumber && isSettled) {
            receiptNumber = await generateUniqueReceiptNumber();
        }

        const collectorId = data.received_by ?? (
            req.user?.user_type === "employee" ? req.user.profile_id : null
        );
        if (collectorId) {
            await ensureCollectorExists(collectorId);
        }

        const paymentDate = data.payment_date
            ? parseDateOnly(data.payment_date)
            : new Date();

        const createData: Prisma.bill_paymentsCreateInput = {
            bill: { connect: { id: bill.id } },
            amount: new Prisma.Decimal(data.amount),
            currency: data.currency,
            payment_date: paymentDate,
            payment_method: "cash",
            status: data.status,
            receipt_number: receiptNumber,
            notes: data.notes ?? null,
        };

        if (collectorId) {
            createData.receiver = { connect: { id: collectorId } };
        }

        const created = await prisma.bill_payments.create({
            data: createData,
            include: paymentListInclude,
        });

        if (isSettled) {
            await refreshBillStatusAfterPayment(bill.id);
        }

        res.status(201).json({
            success: true,
            message: "Payment recorded successfully",
            data: mapPaymentListItem(created),
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
};
