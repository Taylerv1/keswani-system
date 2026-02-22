import { Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import {
    createPaymentSchema,
    updatePaymentSchema,
    paymentQuerySchema,
} from "../validators/payment.validator";
import { AuthenticatedRequest, ApiResponse } from "../types";

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
        const parsed = paymentQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Invalid query params", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const { page, limit, search, status } = parsed.data;
        const skip = (page - 1) * limit;

        const where: Prisma.rent_paymentsWhereInput = { deleted_at: null };
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { contract: { client: { full_name: { contains: search, mode: "insensitive" as Prisma.QueryMode } } } },
                { receipt_number: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
            ];
        }

        const [payments, total] = await Promise.all([
            prisma.rent_payments.findMany({
                where,
                skip,
                take: limit,
                orderBy: { payment_date: "desc" },
                include: paymentInclude,
            }),
            prisma.rent_payments.count({ where }),
        ]);

        // Compute KPI summary (across all payments, not just current page)
        const [paidAgg, overdueCount, activeRentAgg] = await Promise.all([
            prisma.rent_payments.aggregate({
                where: { status: "paid", deleted_at: null },
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
            amount: p.amount,
            currency: p.currency,
            payment_date: p.payment_date,
            period_start: p.period_start,
            period_end: p.period_end,
            payment_method: p.payment_method,
            status: p.status,
            received_by: p.received_by,
            receiver_name: p.receiver?.full_name || null,
            receipt_number: p.receipt_number,
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

        // Auto-set the receiver to the logged-in employee
        const receivedBy = req.user?.user_type === "employee" ? req.user.profile_id : null;

        const payment = await prisma.rent_payments.create({
            data: {
                contract_id: data.contract_id,
                amount: data.amount,
                currency: data.currency,
                payment_date: new Date(data.payment_date),
                period_start: data.period_start ? new Date(data.period_start) : null,
                period_end: data.period_end ? new Date(data.period_end) : null,
                payment_method: data.payment_method,
                status: data.status,
                received_by: receivedBy,
                receipt_number: data.receipt_number,
                notes: data.notes,
            },
            include: paymentInclude,
        });

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
        const updateData: Record<string, unknown> = {};
        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.currency !== undefined) updateData.currency = data.currency;
        if (data.payment_date !== undefined) updateData.payment_date = new Date(data.payment_date);
        if (data.period_start !== undefined) updateData.period_start = data.period_start ? new Date(data.period_start) : null;
        if (data.period_end !== undefined) updateData.period_end = data.period_end ? new Date(data.period_end) : null;
        if (data.payment_method !== undefined) updateData.payment_method = data.payment_method;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.receipt_number !== undefined) updateData.receipt_number = data.receipt_number;
        if (data.notes !== undefined) updateData.notes = data.notes;

        const payment = await prisma.rent_payments.update({
            where: { id },
            data: updateData,
            include: paymentInclude,
        });

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
