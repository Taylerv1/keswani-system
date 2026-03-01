import { Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import {
    createPaymentSchema,
    updatePaymentSchema,
    paymentQuerySchema,
} from "../validators/payment.validator";
import { AuthenticatedRequest, ApiResponse } from "../types";
import {
    createNextInstallmentIfNeeded,
    ensurePaymentSchedulesForActiveContracts,
    markOverdueRentPayments,
} from "../services/payment-schedule.service";

// Shared include for enriched payment responses
const paymentInclude = {
    contract: {
        select: {
            id: true,
            client_id: true,
            monthly_rent: true,
            currency: true,
            status: true,
            client: {
                select: { id: true, full_name: true },
            },
            unit: {
                select: {
                    id: true,
                    unit_number: true,
                    property: { select: { id: true, name: true } },
                },
            },
        },
    },
    receiver: {
        select: { id: true, full_name: true },
    },
} as const;

const SETTLED_PAYMENT_STATUSES = new Set(["paid", "partial"]);
const QUEUE_PAYMENT_STATUSES = ["pending", "overdue", "partial"] as const;
const HISTORY_PAYMENT_STATUSES = ["paid", "cancelled"] as const;

function isSettledStatus(status: string): status is "paid" | "partial" {
    return SETTLED_PAYMENT_STATUSES.has(status);
}

function parseDateOnly(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
}

function getTodayDateOnly(): Date {
    return parseDateOnly(new Date().toISOString().slice(0, 10));
}

function pad2(value: number): string {
    return String(value).padStart(2, "0");
}

function buildReceiptNumberCandidate(now = new Date()): string {
    const year = now.getUTCFullYear();
    const month = pad2(now.getUTCMonth() + 1);
    const day = pad2(now.getUTCDate());
    const hours = pad2(now.getUTCHours());
    const minutes = pad2(now.getUTCMinutes());
    const seconds = pad2(now.getUTCSeconds());
    const randomSuffix = String(Math.floor(Math.random() * 1000)).padStart(3, "0");

    return `RCPT-${year}${month}${day}-${hours}${minutes}${seconds}-${randomSuffix}`;
}

function normalizeOptionalText(
    value: string | undefined | null
): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

async function ensureUniqueReceiptNumber(
    receiptNumber: string,
    excludePaymentId?: string
): Promise<boolean> {
    const existing = await prisma.rent_payments.findFirst({
        where: {
            deleted_at: null,
            receipt_number: receiptNumber,
            ...(excludePaymentId ? { id: { not: excludePaymentId } } : {}),
        },
        select: { id: true },
    });

    return !existing;
}

async function generateUniqueReceiptNumber(excludePaymentId?: string): Promise<string> {
    for (let attempt = 0; attempt < 25; attempt += 1) {
        const candidate = buildReceiptNumberCandidate();
        const isUnique = await ensureUniqueReceiptNumber(candidate, excludePaymentId);
        if (isUnique) return candidate;
    }

    throw new Error("Failed to generate a unique receipt number");
}

/**
 * GET /api/payments
 * List rent payments with status filter, search, pagination.
 * Includes summary KPIs in the response.
 */
export const getPayments = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        await ensurePaymentSchedulesForActiveContracts();
        await markOverdueRentPayments();

        const parsed = paymentQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Invalid query params", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const { page, limit, search, status, view } = parsed.data;
        const skip = (page - 1) * limit;

        const where: Prisma.rent_paymentsWhereInput = { deleted_at: null };
        const scopedStatuses =
            view === "queue"
                ? QUEUE_PAYMENT_STATUSES
                : view === "history"
                    ? HISTORY_PAYMENT_STATUSES
                    : null;

        if (status && scopedStatuses) {
            where.AND = [{ status: { in: [...scopedStatuses] } }, { status }];
        } else if (status) {
            where.status = status;
        } else if (scopedStatuses) {
            where.status = { in: [...scopedStatuses] };
        }
        if (search) {
            where.OR = [
                { contract: { client: { full_name: { contains: search, mode: "insensitive" as Prisma.QueryMode } } } },
                { receipt_number: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
                { manual_receipt_ref: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
                { contract: { unit: { property: { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } } } } },
                { contract: { unit: { unit_number: { contains: search, mode: "insensitive" as Prisma.QueryMode } } } },
            ];
        }

        const [payments, total] = await Promise.all([
            prisma.rent_payments.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ period_start: "desc" }, { payment_date: "desc" }],
                include: paymentInclude,
            }),
            prisma.rent_payments.count({ where }),
        ]);

        // Compute KPI summary (across all payments, not just current page)
        const [paidAgg, overdueCount, activeRentAgg] = await Promise.all([
            prisma.rent_payments.aggregate({
                where: { status: { in: ["paid", "partial"] }, deleted_at: null },
                _sum: { amount: true },
            }),
            prisma.rent_payments.count({
                where: { status: "overdue", deleted_at: null },
            }),
            prisma.contracts.aggregate({
                where: { status: "active", deleted_at: null },
                _sum: { monthly_rent: true },
            }),
        ]);

        const items = payments.map((p) => ({
            id: p.id,
            contract_id: p.contract_id,
            client_id: p.contract.client_id,
            client_name: p.contract.client.full_name,
            property_name: p.contract.unit.property.name,
            unit_number: p.contract.unit.unit_number,
            amount: Number(p.amount),
            currency: p.currency,
            // payment_date is due date (installment due date)
            payment_date: p.payment_date,
            // paid_at is the actual collected date
            paid_at: p.paid_at,
            period_start: p.period_start,
            period_end: p.period_end,
            status: p.status,
            received_by: p.received_by,
            receiver_name: p.receiver?.full_name || null,
            receipt_number: p.receipt_number,
            manual_receipt_ref: p.manual_receipt_ref,
            notes: p.notes,
            created_at: p.created_at,
            updated_at: p.updated_at,
        }));

        res.json({
            success: true,
            data: {
                items,
                pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
                summary: {
                    total_income: Number(activeRentAgg._sum.monthly_rent || 0),
                    total_collected: Number(paidAgg._sum.amount || 0),
                    total_outstanding: overdueCount,
                },
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/payments/:id
 * Single payment with contract + tenant info.
 */
export const getPaymentById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        await markOverdueRentPayments();

        const id = req.params.id as string;

        const payment = await prisma.rent_payments.findFirst({
            where: { id, deleted_at: null },
            include: paymentInclude,
        });

        if (!payment) {
            res.status(404).json({ success: false, error: "Payment not found" });
            return;
        }

        res.json({ success: true, data: payment } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/payments
 * Record a new rent payment. Validates contract is active.
 * Auto-sets received_by to the logged-in employee.
 */
export const createPayment = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = createPaymentSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const data = parsed.data;

        // Validate contract exists and is active
        const contract = await prisma.contracts.findFirst({
            where: { id: data.contract_id, deleted_at: null },
        });
        if (!contract) {
            res.status(404).json({ success: false, error: "Contract not found" });
            return;
        }
        if (contract.status !== "active") {
            res.status(409).json({ success: false, error: "Cannot add payment to a non-active contract" });
            return;
        }

        const status = data.status;
        const manualReceiptRef = normalizeOptionalText(data.manual_receipt_ref) ?? null;
        let receiptNumber = normalizeOptionalText(data.receipt_number) ?? null;

        if (receiptNumber) {
            const isUnique = await ensureUniqueReceiptNumber(receiptNumber);
            if (!isUnique) {
                res.status(409).json({ success: false, error: "Receipt number already exists" });
                return;
            }
        }
        if (isSettledStatus(status) && !receiptNumber) {
            receiptNumber = await generateUniqueReceiptNumber();
        }

        const periodStart = data.period_start ? parseDateOnly(data.period_start) : null;
        const periodEnd = data.period_end ? parseDateOnly(data.period_end) : null;
        if (periodStart && periodEnd && periodStart > periodEnd) {
            res.status(400).json({ success: false, error: "period_start must be before or equal to period_end" });
            return;
        }

        const dueDate = data.payment_date
            ? parseDateOnly(data.payment_date)
            : periodEnd || getTodayDateOnly();
        const parsedPaidAt = data.paid_at ? parseDateOnly(data.paid_at) : null;
        const paidAt = isSettledStatus(status)
            ? parsedPaidAt || getTodayDateOnly()
            : null;

        // Auto-set the receiver to the logged-in employee for settled cash payments
        const receivedBy = isSettledStatus(status) && req.user?.user_type === "employee"
            ? req.user.profile_id
            : null;

        const payment = await prisma.rent_payments.create({
            data: {
                contract_id: data.contract_id,
                amount: data.amount,
                currency: data.currency,
                payment_date: dueDate,
                paid_at: paidAt,
                period_start: periodStart,
                period_end: periodEnd,
                payment_method: "cash",
                status,
                received_by: receivedBy,
                receipt_number: receiptNumber,
                manual_receipt_ref: manualReceiptRef,
                notes: data.notes,
            },
            include: paymentInclude,
        });

        if (status === "paid") {
            await createNextInstallmentIfNeeded(contract.id, {
                period_start: payment.period_start,
                period_end: payment.period_end,
                payment_date: payment.payment_date,
            });
        }

        res.status(201).json({
            success: true,
            data: payment,
            message: "Payment recorded successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/payments/:id
 * Update payment fields.
 */
export const updatePayment = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.rent_payments.findFirst({
            where: { id, deleted_at: null },
            select: {
                id: true,
                contract_id: true,
                status: true,
                receipt_number: true,
                manual_receipt_ref: true,
                payment_date: true,
                paid_at: true,
                period_start: true,
                period_end: true,
            },
        });
        if (!existing) {
            res.status(404).json({ success: false, error: "Payment not found" });
            return;
        }

        const parsed = updatePaymentSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const data = parsed.data;
        const nextStatus = data.status ?? existing.status;
        const normalizedReceiptInput = data.receipt_number !== undefined
            ? normalizeOptionalText(data.receipt_number)
            : undefined;
        const normalizedManualReceiptInput = data.manual_receipt_ref !== undefined
            ? normalizeOptionalText(data.manual_receipt_ref)
            : undefined;

        let nextReceiptNumber = normalizedReceiptInput !== undefined
            ? normalizedReceiptInput
            : existing.receipt_number;

        if (isSettledStatus(nextStatus) && !nextReceiptNumber) {
            nextReceiptNumber = await generateUniqueReceiptNumber(existing.id);
        }

        if (
            nextReceiptNumber &&
            nextReceiptNumber !== existing.receipt_number
        ) {
            const isUnique = await ensureUniqueReceiptNumber(nextReceiptNumber, existing.id);
            if (!isUnique) {
                res.status(409).json({ success: false, error: "Receipt number already exists" });
                return;
            }
        }

        const updateData: Prisma.rent_paymentsUncheckedUpdateInput = {};
        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.currency !== undefined) updateData.currency = data.currency;
        // payment_date is due date
        if (data.payment_date !== undefined) updateData.payment_date = parseDateOnly(data.payment_date);
        if (data.paid_at !== undefined) updateData.paid_at = data.paid_at ? parseDateOnly(data.paid_at) : null;
        if (data.period_start !== undefined) updateData.period_start = data.period_start ? parseDateOnly(data.period_start) : null;
        if (data.period_end !== undefined) updateData.period_end = data.period_end ? parseDateOnly(data.period_end) : null;
        if (data.status !== undefined) updateData.status = data.status;
        if (nextReceiptNumber !== existing.receipt_number) updateData.receipt_number = nextReceiptNumber;
        if (normalizedManualReceiptInput !== undefined) updateData.manual_receipt_ref = normalizedManualReceiptInput;
        if (data.notes !== undefined) updateData.notes = data.notes;
        updateData.payment_method = "cash";

        const transitionedToPaid = existing.status !== "paid" && nextStatus === "paid";
        if (transitionedToPaid && data.paid_at === undefined) {
            updateData.paid_at = getTodayDateOnly();
        }
        if (transitionedToPaid && req.user?.user_type === "employee") {
            updateData.received_by = req.user.profile_id;
        }

        // If payment status is moved back to unsettled, clear actual paid date.
        if (!isSettledStatus(nextStatus)) {
            updateData.paid_at = null;
            updateData.received_by = null;
        }

        const payment = await prisma.rent_payments.update({
            where: { id },
            data: updateData,
            include: paymentInclude,
        });

        if (transitionedToPaid) {
            await createNextInstallmentIfNeeded(existing.contract_id, {
                period_start: payment.period_start,
                period_end: payment.period_end,
                payment_date: payment.payment_date,
            });
        }

        res.json({
            success: true,
            data: payment,
            message: "Payment updated successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/payments/:id
 * Soft delete.
 */
export const deletePayment = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.rent_payments.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            res.status(404).json({ success: false, error: "Payment not found" });
            return;
        }

        await prisma.rent_payments.update({
            where: { id },
            data: { deleted_at: new Date() },
        });

        res.json({ success: true, message: "Payment has been soft-deleted" } as ApiResponse);
    } catch (err) {
        next(err);
    }
};
