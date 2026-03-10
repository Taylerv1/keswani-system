import { NextFunction, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { ApiResponse, AuthenticatedRequest } from "../types";
import { electricityBillQuerySchema } from "../validators/electricity-bill.validator";

const OPEN_BILL_STATUSES: Array<"pending" | "overdue"> = [
    "pending",
    "overdue",
];
const SETTLED_PAYMENT_STATUSES: Array<"paid"> = ["paid"];

const billListInclude = {
    meter: {
        select: {
            id: true,
            meter_number: true,
        },
    },
    subscriber: {
        select: {
            id: true,
            subscription_number: true,
            is_active: true,
            client: {
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    phone: true,
                },
            },
            property: {
                select: {
                    id: true,
                    name: true,
                },
            },
            unit: {
                select: {
                    id: true,
                    unit_number: true,
                },
            },
        },
    },
} as const;

const billDetailInclude = {
    ...billListInclude,
    generator: {
        select: {
            id: true,
            full_name: true,
        },
    },
} as const;

type BillListPayload = Prisma.billsGetPayload<{ include: typeof billListInclude }>;
type BillDetailPayload = Prisma.billsGetPayload<{ include: typeof billDetailInclude }>;

function toNumber(value: unknown): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
}

function formatDateOnly(value: Date | null | undefined): string | null {
    if (!value) return null;
    return value.toISOString().slice(0, 10);
}

function toMonth(value: Date | null | undefined): string {
    return formatDateOnly(value)?.slice(0, 7) ?? "";
}

function addDays(value: Date, days: number): Date {
    const date = new Date(value);
    date.setUTCDate(date.getUTCDate() + days);
    return date;
}

function parseMonthStart(month: string): Date {
    return new Date(`${month}-01T00:00:00.000Z`);
}

async function getPaymentSummaryByBillIds(billIds: string[]) {
    if (billIds.length === 0) {
        return {
            paidByBillId: new Map<string, number>(),
            countByBillId: new Map<string, number>(),
        };
    }

    const [paidRows, countRows] = await Promise.all([
        prisma.bill_payments.groupBy({
            by: ["bill_id"],
            where: {
                bill_id: { in: billIds },
                deleted_at: null,
                status: { in: SETTLED_PAYMENT_STATUSES },
            },
            _sum: { amount: true },
        }),
        prisma.bill_payments.groupBy({
            by: ["bill_id"],
            where: {
                bill_id: { in: billIds },
                deleted_at: null,
            },
            _count: { _all: true },
        }),
    ]);

    const paidByBillId = new Map<string, number>();
    for (const row of paidRows) {
        paidByBillId.set(row.bill_id, toNumber(row._sum?.amount));
    }

    const countByBillId = new Map<string, number>();
    for (const row of countRows) {
        countByBillId.set(row.bill_id, row._count._all);
    }

    return { paidByBillId, countByBillId };
}

function mapBillListItem(
    bill: BillListPayload | BillDetailPayload,
    paidAmount: number,
    paymentCount: number
) {
    const totalAmount = toNumber(bill.total_amount);
    const outstandingAmount = Math.max(0, totalAmount - paidAmount);

    return {
        id: bill.id,
        meter_id: bill.meter_id,
        meter_number: bill.meter.meter_number,
        subscriber_id: bill.subscriber_id,
        subscriber_name: bill.subscriber.client.full_name,
        subscription_number: bill.subscriber.subscription_number,
        subscriber_email: bill.subscriber.client.email,
        subscriber_phone: bill.subscriber.client.phone,
        property: bill.subscriber.property,
        unit: bill.subscriber.unit,
        billing_period_start: formatDateOnly(bill.billing_period_start),
        billing_period_end: formatDateOnly(bill.billing_period_end),
        month: toMonth(bill.billing_period_end),
        due_date: formatDateOnly(addDays(bill.billing_period_end, 15)),
        previous_reading: toNumber(bill.previous_reading),
        current_reading: toNumber(bill.current_reading),
        consumption_kwh: toNumber(bill.consumption_kwh),
        price_per_kwh: toNumber(bill.price_per_kwh),
        total_amount: totalAmount,
        currency: bill.currency,
        status: bill.status,
        paid_amount: paidAmount,
        outstanding_amount: outstandingAmount,
        payment_count: paymentCount,
        notes: bill.notes,
        created_at: bill.created_at,
        updated_at: bill.updated_at,
    };
}

/**
 * GET /api/bills
 * Electricity bills list with summary values.
 */
export const getElectricityBills = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = electricityBillQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Invalid query params",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { page, limit, search, status, month, subscriber_id, meter_id } = parsed.data;
        const skip = (page - 1) * limit;

        const where: Prisma.billsWhereInput = {
            deleted_at: null,
            subscriber: {
                deleted_at: null,
            },
            meter: {
                deleted_at: null,
            },
        };

        if (status === "open") {
            where.status = { in: OPEN_BILL_STATUSES };
        } else if (status) {
            where.status = status;
        }

        if (month) {
            const start = parseMonthStart(month);
            const end = new Date(start);
            end.setUTCMonth(end.getUTCMonth() + 1);
            where.billing_period_end = {
                gte: start,
                lt: end,
            };
        }

        if (subscriber_id) {
            where.subscriber_id = subscriber_id;
        }

        if (meter_id) {
            where.meter_id = meter_id;
        }

        if (search) {
            where.OR = [
                {
                    meter: {
                        meter_number: {
                            contains: search,
                            mode: "insensitive" as Prisma.QueryMode,
                        },
                    },
                },
                {
                    subscriber: {
                        subscription_number: {
                            contains: search,
                            mode: "insensitive" as Prisma.QueryMode,
                        },
                    },
                },
                {
                    subscriber: {
                        client: {
                            full_name: {
                                contains: search,
                                mode: "insensitive" as Prisma.QueryMode,
                            },
                        },
                    },
                },
            ];
        }

        const [bills, total, allMonths] = await Promise.all([
            prisma.bills.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ billing_period_end: "desc" }, { created_at: "desc" }],
                include: billListInclude,
            }),
            prisma.bills.count({ where }),
            prisma.bills.findMany({
                where: { deleted_at: null },
                select: { billing_period_end: true },
                orderBy: { billing_period_end: "desc" },
            }),
        ]);

        const billIds = bills.map((bill) => bill.id);
        const paymentSummary = await getPaymentSummaryByBillIds(billIds);

        const items = bills.map((bill) =>
            mapBillListItem(
                bill,
                paymentSummary.paidByBillId.get(bill.id) ?? 0,
                paymentSummary.countByBillId.get(bill.id) ?? 0
            )
        );

        const availableMonths = Array.from(
            new Set(allMonths.map((item) => toMonth(item.billing_period_end)).filter(Boolean))
        );

        res.json({
            success: true,
            data: {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    total_pages: Math.ceil(total / limit),
                },
                meta: {
                    available_months: availableMonths,
                },
            },
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/bills/:id
 * Electricity bill details with payment history.
 */
export const getElectricityBillById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const bill = await prisma.bills.findFirst({
            where: {
                id,
                deleted_at: null,
                subscriber: { deleted_at: null },
                meter: { deleted_at: null },
            },
            include: billDetailInclude,
        });

        if (!bill) {
            res.status(404).json({ success: false, error: "Bill not found" });
            return;
        }

        const [payments, paymentSummary] = await Promise.all([
            prisma.bill_payments.findMany({
                where: {
                    bill_id: id,
                    deleted_at: null,
                },
                orderBy: [{ payment_date: "desc" }, { created_at: "desc" }],
                include: {
                    receiver: {
                        select: {
                            id: true,
                            full_name: true,
                        },
                    },
                },
            }),
            getPaymentSummaryByBillIds([id]),
        ]);

        const paidAmount = paymentSummary.paidByBillId.get(id) ?? 0;
        const paymentCount = paymentSummary.countByBillId.get(id) ?? 0;

        res.json({
            success: true,
            data: {
                ...mapBillListItem(bill, paidAmount, paymentCount),
                generated_by: bill.generated_by,
                generated_by_name: bill.generator?.full_name ?? null,
                payments: payments.map((payment) => ({
                    id: payment.id,
                    amount: toNumber(payment.amount),
                    currency: payment.currency,
                    payment_date: formatDateOnly(payment.payment_date),
                    status: payment.status,
                    payment_method: payment.payment_method,
                    received_by: payment.received_by,
                    collector_name: payment.receiver?.full_name ?? null,
                    receipt_number: payment.receipt_number,
                    notes: payment.notes,
                    created_at: payment.created_at,
                })),
            },
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
};
