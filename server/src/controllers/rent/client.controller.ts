import { Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma";
import {
    createClientSchema,
    updateClientSchema,
    clientQuerySchema,
} from "../../validators/rent/client.validator";
import { AuthenticatedRequest, ApiResponse } from "../../types";

/**
 * GET /api/clients
 * List clients with search + pagination.
 * Enriches each client with their active contract info (property, unit, rent).
 */
export const getClients = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = clientQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Invalid query params", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const { page, limit, search } = parsed.data;
        const skip = (page - 1) * limit;

        const where: Prisma.clientsWhereInput = { deleted_at: null };
        if (search) {
            where.OR = [
                { full_name: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
                { email: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
                { phone: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
            ];
        }

        const [clients, total] = await Promise.all([
            prisma.clients.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: "desc" },
                include: {
                    contracts: {
                        where: { status: "active", deleted_at: null },
                        take: 1,
                        orderBy: { start_date: "desc" },
                        include: {
                            unit: {
                                select: {
                                    id: true,
                                    unit_number: true,
                                    property_id: true,
                                    property: {
                                        select: { id: true, name: true },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
            prisma.clients.count({ where }),
        ]);

        const enriched = clients.map((cli) => {
            const ac = cli.contracts[0] || null;
            return {
                id: cli.id,
                full_name: cli.full_name,
                email: cli.email,
                phone: cli.phone,
                address: cli.address,
                notes: cli.notes,
                active_contract: ac
                    ? {
                        id: ac.id,
                        property_id: ac.unit.property_id,
                        property_name: ac.unit.property.name,
                        unit_id: ac.unit.id,
                        unit_number: ac.unit.unit_number,
                        monthly_rent: ac.monthly_rent,
                        currency: ac.currency,
                        start_date: ac.start_date,
                        end_date: ac.end_date,
                        status: ac.status,
                    }
                    : null,
                created_at: cli.created_at,
                updated_at: cli.updated_at,
            };
        });

        res.json({
            success: true,
            data: {
                items: enriched,
                pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/clients/:id
 * Single client with all contracts + payment summary.
 */
export const getClientById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const client = await prisma.clients.findFirst({
            where: { id, deleted_at: null },
            include: {
                contracts: {
                    where: { deleted_at: null },
                    orderBy: { start_date: "desc" },
                    include: {
                        unit: {
                            select: {
                                id: true,
                                unit_number: true,
                                property: { select: { id: true, name: true } },
                            },
                        },
                        rent_payments: {
                            where: { deleted_at: null },
                            orderBy: { payment_date: "desc" },
                            take: 10,
                            select: {
                                id: true,
                                amount: true,
                                currency: true,
                                payment_date: true,
                                status: true,
                                period_start: true,
                                period_end: true,
                            },
                        },
                    },
                },
                maintenance_requests: {
                    where: { deleted_at: null },
                    orderBy: { created_at: "desc" },
                    take: 5,
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                        created_at: true,
                    },
                },
            },
        });

        if (!client) {
            res.status(404).json({ success: false, error: "Client not found" });
            return;
        }

        res.json({ success: true, data: client } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/clients
 * Create a new client.
 */
export const createClient = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = createClientSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors });
            return;
        }

        if (parsed.data.email) {
            const emailExists = await prisma.clients.findFirst({
                where: { email: parsed.data.email, deleted_at: null },
            });
            if (emailExists) {
                res.status(409).json({ success: false, error: "A client with this email already exists" });
                return;
            }
        }

        const client = await prisma.clients.create({
            data: {
                full_name: parsed.data.full_name,
                email: parsed.data.email || null,
                phone: parsed.data.phone || null,
                // address: parsed.data.address || null,
                notes: parsed.data.notes || null,
            },
        });

        res.status(201).json({
            success: true,
            data: client,
            message: "Client created successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/clients/:id
 * Update client fields.
 */
export const updateClient = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.clients.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            res.status(404).json({ success: false, error: "Client not found" });
            return;
        }

        const parsed = updateClientSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors });
            return;
        }

        if (parsed.data.email && parsed.data.email !== existing.email) {
            const emailExists = await prisma.clients.findFirst({
                where: { email: parsed.data.email, deleted_at: null, id: { not: id } },
            });
            if (emailExists) {
                res.status(409).json({ success: false, error: "A client with this email already exists" });
                return;
            }
        }

        const client = await prisma.clients.update({
            where: { id },
            data: parsed.data,
        });

        res.json({
            success: true,
            data: client,
            message: "Client updated successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/clients/:id
 * Soft delete — only if no active contracts.
 */
export const deleteClient = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.clients.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            res.status(404).json({ success: false, error: "Client not found" });
            return;
        }

        const activeContracts = await prisma.contracts.count({
            where: { client_id: id, status: "active", deleted_at: null },
        });

        if (activeContracts > 0) {
            res.status(409).json({
                success: false,
                error: `Cannot delete: client has ${activeContracts} active contract(s). Terminate or expire them first.`,
            });
            return;
        }

        await prisma.clients.update({
            where: { id },
            data: { deleted_at: new Date() },
        });

        res.json({ success: true, message: "Client has been soft-deleted" } as ApiResponse);
    } catch (err) {
        next(err);
    }
};
