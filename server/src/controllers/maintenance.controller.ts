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

type MaintenanceWithRelations = Prisma.maintenance_requestsGetPayload<{
    include: typeof maintenanceInclude;
}>;

function hasRentAccess(access: Prisma.JsonValue | null): boolean {
    if (!access || typeof access !== "object" || Array.isArray(access)) return false;
    const raw = (access as Record<string, unknown>).rent;

    if (typeof raw === "boolean") return raw;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;

    return (raw as Record<string, unknown>).enabled === true;
}

function formatMaintenanceStatus(status: string): string {
    if (status === "pending") return "Pending";
    if (status === "in_progress") return "In Progress";
    if (status === "completed") return "Completed";
    if (status === "cancelled") return "Cancelled";
    return status;
}

function formatMaintenancePriority(priority: string): string {
    if (priority === "critical") return "Critical";
    if (priority === "urgent") return "Urgent";
    if (priority === "high") return "High";
    if (priority === "medium") return "Medium";
    if (priority === "low") return "Low";
    return priority;
}

async function notifyRentEmployeesOfNewMaintenanceRequest(
    request: MaintenanceWithRelations
): Promise<void> {
    const employees = await prisma.employees.findMany({
        where: { deleted_at: null, is_active: true },
        select: { id: true, role: true, access: true },
    });

    const recipientIds = employees
        .filter(
            (employee) =>
                employee.role === "owner" ||
                employee.role === "admin" ||
                hasRentAccess(employee.access)
        )
        .map((employee) => employee.id);

    if (recipientIds.length === 0) return;

    const requesterName = request.requester?.full_name || "Tenant";
    const locationEn = `${request.unit.property.name}, Unit ${request.unit.unit_number}`;
    const locationAr = `${request.unit.property.name}، وحدة ${request.unit.unit_number}`;
    const description = request.title.trim();
    const estimatedCostTextEn =
        request.estimated_cost != null
            ? ` Estimated cost: ${Number(request.estimated_cost).toLocaleString()} USD.`
            : "";
    const estimatedCostTextAr =
        request.estimated_cost != null
            ? ` التكلفة التقديرية: ${Number(request.estimated_cost).toLocaleString()} دولار.`
            : "";

    await prisma.notifications.createMany({
        data: recipientIds.map((recipientId) => ({
            recipient_type: "employee",
            recipient_id: recipientId,
            channel: "in_app",
            section: "rent",
            notification_type: "maintenance",
            subject: "New Maintenance Request",
            body: JSON.stringify({
                en: `${requesterName} submitted "${description}" at ${locationEn}.${estimatedCostTextEn}`,
                ar: `قدّم ${requesterName} طلب صيانة: "${description}" في ${locationAr}.${estimatedCostTextAr}`,
            }),
            related_entity_type: "maintenance_request",
            related_entity_id: request.id,
            status: "sent",
        })),
    });
}

async function notifyRequesterMaintenanceUpdated(
    request: MaintenanceWithRelations,
    options: {
        statusChanged: boolean;
        priorityChanged: boolean;
        assigneeChanged: boolean;
        actualCostChanged: boolean;
    }
): Promise<void> {
    if (!request.requested_by) return;

    const details_en: string[] = [];
    const details_ar: string[] = [];

    const statusArMap: Record<string, string> = {
        pending: "قيد الانتظار", in_progress: "قيد التنفيذ", completed: "مكتمل", cancelled: "ملغى",
    };
    const priorityArMap: Record<string, string> = {
        critical: "بالغ الأهمية", urgent: "عاجل", high: "عالية", medium: "متوسطة", low: "منخفضة",
    };

    if (options.statusChanged) {
        details_en.push(`Status: ${formatMaintenanceStatus(request.status)}`);
        details_ar.push(`الحالة: ${statusArMap[request.status] ?? request.status}`);
    }
    if (options.priorityChanged) {
        details_en.push(`Priority: ${formatMaintenancePriority(request.priority)}`);
        details_ar.push(`الأولوية: ${priorityArMap[request.priority] ?? request.priority}`);
    }
    if (options.assigneeChanged) {
        details_en.push(
            request.assignee?.full_name
                ? `Assigned To: ${request.assignee.full_name}`
                : "Assigned To: Unassigned"
        );
        details_ar.push(
            request.assignee?.full_name
                ? `المسؤول: ${request.assignee.full_name}`
                : "المسؤول: غير محدد"
        );
    }
    if (options.actualCostChanged && request.actual_cost != null) {
        details_en.push(`Cost: ${Number(request.actual_cost).toLocaleString()} USD`);
        details_ar.push(`التكلفة: ${Number(request.actual_cost).toLocaleString()} دولار`);
    }

    const detailsTextEn =
        details_en.length > 0 ? ` ${details_en.join(" | ")}.` : " Please check latest updates.";
    const detailsTextAr =
        details_ar.length > 0 ? ` ${details_ar.join(" | ")}.` : " يرجى مراجعة آخر التحديثات.";

    await prisma.notifications.create({
        data: {
            recipient_type: "client",
            recipient_id: request.requested_by,
            channel: "in_app",
            section: "rent",
            notification_type: "maintenance",
            subject: "Maintenance Request Updated",
            body: JSON.stringify({
                en: `Your maintenance request "${request.title}" was updated.${detailsTextEn}`,
                ar: `تم تحديث طلب الصيانة الخاص بك "${request.title}".${detailsTextAr}`,
            }),
            related_entity_type: "maintenance_request",
            related_entity_id: request.id,
            status: "sent",
        },
    });
}

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

        if (req.user?.user_type === "client") {
            where.requested_by = req.user.profile_id;
        }

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

        const where: Prisma.maintenance_requestsWhereInput = {
            id,
            deleted_at: null,
        };

        if (req.user?.user_type === "client") {
            where.requested_by = req.user.profile_id;
        }

        const request = await prisma.maintenance_requests.findFirst({
            where,
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
        const isClient = req.user?.user_type === "client";
        const clientProfileId = isClient ? req.user?.profile_id : undefined;

        let unitId = data.unit_id;

        if (isClient) {
            if (!clientProfileId) {
                res.status(401).json({ success: false, error: "Not authenticated" });
                return;
            }

            const activeContract = await prisma.contracts.findFirst({
                where: {
                    client_id: clientProfileId,
                    status: "active",
                    deleted_at: null,
                    unit: { deleted_at: null },
                },
                orderBy: { updated_at: "desc" },
                select: { unit_id: true },
            });

            if (!activeContract) {
                res.status(409).json({
                    success: false,
                    error: "No active contract found for this client",
                });
                return;
            }

            unitId = activeContract.unit_id;
        } else if (!unitId) {
            res.status(400).json({
                success: false,
                error: "unit_id is required for employee-created requests",
            });
            return;
        }

        // Validate unit exists
        const unit = await prisma.units.findFirst({
            where: { id: unitId, deleted_at: null },
        });
        if (!unit) {
            res.status(404).json({ success: false, error: "Unit not found" });
            return;
        }

        const createData: Prisma.maintenance_requestsCreateInput = {
            unit: { connect: { id: unitId } },
            title: data.title,
            description: data.description || undefined,
            priority: isClient ? "medium" : data.priority ?? "medium",
            estimated_cost: data.estimated_cost,
        };

        // If the requester is a client and is authenticated, set requested_by to their profile.
        if (isClient) {
            createData.requester = { connect: { id: clientProfileId } };
        } else if (data.requested_by) {
            // Employees may create requests on behalf of a client
            createData.requester = { connect: { id: data.requested_by } };
        }

        if (!isClient && data.assigned_to) {
            createData.assignee = { connect: { id: data.assigned_to } };
        }

        const request = await prisma.maintenance_requests.create({
            data: createData,
            include: maintenanceInclude,
        });

        try {
            await notifyRentEmployeesOfNewMaintenanceRequest(request);
        } catch (notificationError) {
            console.error("Failed to create maintenance notification:", notificationError);
        }

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
            include: maintenanceInclude,
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
        const statusChanged = data.status !== undefined && data.status !== existing.status;
        const priorityChanged =
            data.priority !== undefined && data.priority !== existing.priority;
        const assigneeChanged =
            data.assigned_to !== undefined && data.assigned_to !== existing.assigned_to;
        const actualCostChanged =
            data.actual_cost !== undefined &&
            String(data.actual_cost ?? "") !== String(existing.actual_cost ?? "");

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

        if (statusChanged || priorityChanged || assigneeChanged || actualCostChanged) {
            try {
                await notifyRequesterMaintenanceUpdated(request, {
                    statusChanged,
                    priorityChanged,
                    assigneeChanged,
                    actualCostChanged,
                });
            } catch (notificationError) {
                console.error(
                    "Failed to create maintenance update notification:",
                    notificationError
                );
            }
        }

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
