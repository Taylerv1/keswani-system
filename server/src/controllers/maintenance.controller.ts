import { Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import {
    createMaintenanceSchema,
    updateMaintenanceSchema,
    maintenanceQuerySchema,
} from "../validators/maintenance.validator";
import { AuthenticatedRequest, ApiResponse } from "../types";

// Shared include for enriched maintenance responses
const maintenanceInclude = {
    unit: {
        select: {
            id: true,
            unit_number: true,
            property_id: true,
            property: { select: { id: true, name: true } },
        },
    },
    requester: {
        select: { id: true, full_name: true },
    },
    assignee: {
        select: { id: true, full_name: true },
    },
} as const;

/**
 * GET /api/maintenance
 * List maintenance requests with status/priority filters, search, pagination.
 */
export const getMaintenanceRequests = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = maintenanceQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Invalid query params", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const { page, limit, search, status, priority } = parsed.data;
        const skip = (page - 1) * limit;

        const where: Prisma.maintenance_requestsWhereInput = { deleted_at: null };
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
                { description: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
                { unit: { property: { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } } } },
                { requester: { full_name: { contains: search, mode: "insensitive" as Prisma.QueryMode } } },
            ];
        }

        const [requests, total] = await Promise.all([
            prisma.maintenance_requests.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: "desc" },
                include: maintenanceInclude,
            }),
            prisma.maintenance_requests.count({ where }),
        ]);

        const items = requests.map((m) => ({
            id: m.id,
            unit_id: m.unit_id,
            unit_number: m.unit.unit_number,
            property_id: m.unit.property_id,
            property_name: m.unit.property.name,
            requested_by: m.requested_by,
            requester_name: m.requester?.full_name || null,
            assigned_to: m.assigned_to,
            assignee_name: m.assignee?.full_name || null,
            title: m.title,
            description: m.description,
            status: m.status,
            priority: m.priority,
            estimated_cost: m.estimated_cost,
            actual_cost: m.actual_cost,
            completed_at: m.completed_at,
            created_at: m.created_at,
            updated_at: m.updated_at,
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
 * GET /api/maintenance/:id
 * Single maintenance request with full details.
 */
export const getMaintenanceById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const request = await prisma.maintenance_requests.findFirst({
            where: { id, deleted_at: null },
            include: maintenanceInclude,
        });

        if (!request) {
            res.status(404).json({ success: false, error: "Maintenance request not found" });
            return;
        }

        res.json({ success: true, data: request } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/maintenance
 * Create a new maintenance request.
 */
export const createMaintenance = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = createMaintenanceSchema.safeParse(req.body);
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

        const createData: Prisma.maintenance_requestsCreateInput = {
            unit: { connect: { id: data.unit_id } },
            title: data.title,
            description: data.description,
            priority: data.priority,
            estimated_cost: data.estimated_cost,
        };

        // If the requester is a client and is authenticated, set requested_by to their profile.
        if (req.user?.user_type === "client") {
            createData.requester = { connect: { id: req.user.profile_id } };
        } else if (data.requested_by) {
            // Employees may create requests on behalf of a client
            createData.requester = { connect: { id: data.requested_by } };
        }

        if (data.assigned_to) {
            createData.assignee = { connect: { id: data.assigned_to } };
        }

        const request = await prisma.maintenance_requests.create({
            data: createData,
            include: maintenanceInclude,
        });

        res.status(201).json({
            success: true,
            data: request,
            message: "Maintenance request created successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/maintenance/:id
 * Update maintenance request. Auto-sets completed_at when status → completed.
 */
export const updateMaintenance = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.maintenance_requests.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            res.status(404).json({ success: false, error: "Maintenance request not found" });
            return;
        }

        const parsed = updateMaintenanceSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const data = parsed.data;

        // Build update input
        const updateData: Prisma.maintenance_requestsUpdateInput = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.priority !== undefined) updateData.priority = data.priority;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.estimated_cost !== undefined) updateData.estimated_cost = data.estimated_cost;
        if (data.actual_cost !== undefined) updateData.actual_cost = data.actual_cost;

        // Handle relations
        if (data.unit_id !== undefined) {
            updateData.unit = { connect: { id: data.unit_id } };
        }
        if (data.requested_by !== undefined) {
            if (data.requested_by === null) {
                updateData.requester = { disconnect: true };
            } else {
                updateData.requester = { connect: { id: data.requested_by } };
            }
        }
        if (data.assigned_to !== undefined) {
            if (data.assigned_to === null) {
                updateData.assignee = { disconnect: true };
            } else {
                updateData.assignee = { connect: { id: data.assigned_to } };
            }
        }

        // Auto-set completed_at
        if (data.status === "completed" && existing.status !== "completed") {
            updateData.completed_at = new Date();
        } else if (data.status && data.status !== "completed" && existing.status === "completed") {
            updateData.completed_at = null;
        }

        const request = await prisma.maintenance_requests.update({
            where: { id },
            data: updateData,
            include: maintenanceInclude,
        });

        res.json({
            success: true,
            data: request,
            message: "Maintenance request updated successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/maintenance/:id
 * Soft delete.
 */
export const deleteMaintenance = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.maintenance_requests.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            res.status(404).json({ success: false, error: "Maintenance request not found" });
            return;
        }

        await prisma.maintenance_requests.update({
            where: { id },
            data: { deleted_at: new Date() },
        });

        res.json({ success: true, message: "Maintenance request has been soft-deleted" } as ApiResponse);
    } catch (err) {
        next(err);
    }
};
