import { Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma";
import {
    createContractSchema,
    updateContractSchema,
    contractQuerySchema,
} from "../../validators/rent/contract.validator";
import { AuthenticatedRequest, ApiResponse } from "../../types";

// Shared include for enriched contract responses
const contractInclude = {
    unit: {
        select: {
            id: true,
            unit_number: true,
            property_id: true,
            property: { select: { id: true, name: true } },
        },
    },
    client: {
        select: { id: true, full_name: true, email: true, phone: true },
    },
} as const;

/**
 * GET /api/contracts
 * List contracts with status filter, search (tenant/property name), pagination.
 */
export const getContracts = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = contractQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Invalid query params", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const { page, limit, search, status } = parsed.data;
        const skip = (page - 1) * limit;

        const where: Prisma.contractsWhereInput = { deleted_at: null };
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { client: { full_name: { contains: search, mode: "insensitive" as Prisma.QueryMode } } },
                { unit: { property: { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } } } },
                { unit: { unit_number: { contains: search, mode: "insensitive" as Prisma.QueryMode } } },
            ];
        }

        const [contracts, total] = await Promise.all([
            prisma.contracts.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: "desc" },
                include: contractInclude,
            }),
            prisma.contracts.count({ where }),
        ]);

        const items = contracts.map((c) => ({
            id: c.id,
            unit_id: c.unit_id,
            unit_number: c.unit.unit_number,
            property_id: c.unit.property_id,
            property_name: c.unit.property.name,
            client_id: c.client_id,
            client_name: c.client.full_name,
            start_date: c.start_date,
            end_date: c.end_date,
            monthly_rent: c.monthly_rent,
            currency: c.currency,
            deposit_amount: c.deposit_amount,
            status: c.status,
            notes: c.notes,
            created_at: c.created_at,
            updated_at: c.updated_at,
        }));

        res.json({
            success: true,
            data: {
                items,
                pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/contracts/:id
 * Single contract with unit, property, tenant info + recent payments.
 */
export const getContractById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const contract = await prisma.contracts.findFirst({
            where: { id, deleted_at: null },
            include: {
                ...contractInclude,
                rent_payments: {
                    where: { deleted_at: null },
                    orderBy: { payment_date: "desc" },
                    take: 20,
                    select: {
                        id: true,
                        amount: true,
                        currency: true,
                        payment_date: true,
                        period_start: true,
                        period_end: true,
                        payment_method: true,
                        status: true,
                        receipt_number: true,
                        notes: true,
                    },
                },
            },
        });

        if (!contract) {
            res.status(404).json({ success: false, error: "Contract not found" });
            return;
        }

        res.json({ success: true, data: contract } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/contracts
 * Create a new contract.
 */
export const createContract = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = createContractSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const data = parsed.data;

        // Validate unit exists
        const unit = await prisma.units.findFirst({
            where: { id: data.unit_id, deleted_at: null },
        });
        if (!unit) {
            res.status(404).json({ success: false, error: "Unit not found" });
            return;
        }

        // Check no active contract on this unit
        const existingActive = await prisma.contracts.count({
            where: { unit_id: data.unit_id, status: "active", deleted_at: null },
        });
        if (existingActive > 0) {
            res.status(409).json({ success: false, error: "This unit already has an active contract" });
            return;
        }

        // Validate client exists
        const client = await prisma.clients.findFirst({
            where: { id: data.client_id, deleted_at: null },
        });
        if (!client) {
            res.status(404).json({ success: false, error: "Client not found" });
            return;
        }

        const contract = await prisma.contracts.create({
            data: {
                unit_id: data.unit_id,
                client_id: data.client_id,
                start_date: new Date(data.start_date),
                end_date: data.end_date ? new Date(data.end_date) : null,
                monthly_rent: data.monthly_rent,
                currency: data.currency,
                deposit_amount: data.deposit_amount,
                status: data.status,
                notes: data.notes,
            },
            include: contractInclude,
        });

        res.status(201).json({
            success: true,
            data: contract,
            message: "Contract created successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/contracts/:id
 * Update contract fields.
 */
export const updateContract = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.contracts.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            res.status(404).json({ success: false, error: "Contract not found" });
            return;
        }

        const parsed = updateContractSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const data = parsed.data;

        // Build update payload
        const updateData: Record<string, unknown> = {};
        if (data.unit_id !== undefined) updateData.unit_id = data.unit_id;
        if (data.client_id !== undefined) updateData.client_id = data.client_id;
        if (data.start_date !== undefined) updateData.start_date = new Date(data.start_date);
        if (data.end_date !== undefined) updateData.end_date = data.end_date ? new Date(data.end_date) : null;
        if (data.monthly_rent !== undefined) updateData.monthly_rent = data.monthly_rent;
        if (data.currency !== undefined) updateData.currency = data.currency;
        if (data.deposit_amount !== undefined) updateData.deposit_amount = data.deposit_amount;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.notes !== undefined) updateData.notes = data.notes;

        const contract = await prisma.contracts.update({
            where: { id },
            data: updateData,
            include: contractInclude,
        });

        res.json({
            success: true,
            data: contract,
            message: "Contract updated successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/contracts/:id
 * Soft delete.
 */
export const deleteContract = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.contracts.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            res.status(404).json({ success: false, error: "Contract not found" });
            return;
        }

        // Check for payments
        const paymentCount = await prisma.rent_payments.count({
            where: { contract_id: id, deleted_at: null },
        });
        if (paymentCount > 0) {
            res.status(409).json({
                success: false,
                error: `Cannot delete: contract has ${paymentCount} payment(s). Remove them first.`,
            });
            return;
        }

        await prisma.contracts.update({
            where: { id },
            data: { deleted_at: new Date() },
        });

        res.json({ success: true, message: "Contract has been soft-deleted" } as ApiResponse);
    } catch (err) {
        next(err);
    }
};
