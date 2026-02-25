import { z } from "zod";

const maintenanceStatusEnum = z.enum(["pending", "in_progress", "completed", "cancelled"]);
const maintenancePriorityEnum = z.enum(["low", "medium", "high", "urgent", "critical"]);

// -------------------------------------------
// Create Maintenance Request
// -------------------------------------------
export const createMaintenanceSchema = z.object({
    unit_id: z.string().uuid(),
    requested_by: z.string().uuid().optional(),
    assigned_to: z.string().uuid().optional(),
    title: z.string().min(1).max(500),
    description: z.string().max(5000).optional(),
    priority: maintenancePriorityEnum.default("medium"),
    estimated_cost: z.number().min(0).optional(),
});

// -------------------------------------------
// Update Maintenance Request
// -------------------------------------------
export const updateMaintenanceSchema = z.object({
    unit_id: z.string().uuid().optional(),
    requested_by: z.string().uuid().nullable().optional(),
    assigned_to: z.string().uuid().nullable().optional(),
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(5000).nullable().optional(),
    priority: maintenancePriorityEnum.optional(),
    status: maintenanceStatusEnum.optional(),
    estimated_cost: z.number().min(0).nullable().optional(),
    actual_cost: z.number().min(0).nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

// -------------------------------------------
// Query Params
// -------------------------------------------
export const maintenanceQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional(),
    status: maintenanceStatusEnum.optional(),
    priority: maintenancePriorityEnum.optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type MaintenanceQueryParams = z.infer<typeof maintenanceQuerySchema>;
