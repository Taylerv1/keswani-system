import { z } from "zod";

const maintenanceStatusEnum = z.enum(["pending", "in_progress", "completed", "cancelled"]);
const maintenancePriorityEnum = z.enum(["low", "medium", "high", "urgent", "critical"]);

function normalizeMoneyString(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return "";

    // Normalize Arabic-Indic and Extended Arabic-Indic digits to Latin.
    const latinized = trimmed
        .replace(/[\u0660-\u0669]/g, (digit) =>
            String(digit.charCodeAt(0) - 0x0660)
        )
        .replace(/[\u06F0-\u06F9]/g, (digit) =>
            String(digit.charCodeAt(0) - 0x06f0)
        );

    // Keep only numeric-related symbols, then normalize decimal/group separators.
    let normalized = latinized
        .replace(/[^0-9.,+\-\u066B\u066C]/g, "")
        .replace(/\u066B/g, ".") // Arabic decimal separator
        .replace(/\u066C/g, ","); // Arabic thousands separator -> comma

    const hasDot = normalized.includes(".");
    const hasComma = normalized.includes(",");

    if (hasDot && hasComma) {
        // e.g. 1,234.56 -> remove grouping commas
        normalized = normalized.replace(/,/g, "");
    } else if (!hasDot && hasComma) {
        // e.g. 123,45 -> treat comma as decimal separator
        normalized = normalized.replace(/,/g, ".");
    } else {
        // e.g. 1,234 -> remove grouping commas
        normalized = normalized.replace(/,/g, "");
    }

    return normalized;
}

function coerceMoneyValue(value: unknown): unknown {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return value;

    const normalized = normalizeMoneyString(value);
    if (!normalized) return undefined;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : value;
}

const optionalMoneyNumber = z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return undefined;
    return coerceMoneyValue(value);
}, z.number().min(0).optional());

const nullableMoneyNumber = z.preprocess((value) => {
    if (value === undefined || value === "") return undefined;
    if (value === null) return null;
    return coerceMoneyValue(value);
}, z.number().min(0).nullable().optional());

// -------------------------------------------
// Create Maintenance Request
// -------------------------------------------
export const createMaintenanceSchema = z.object({
    // Optional at schema level so client users can submit without choosing a unit.
    // Controller enforces this for employees and auto-detects it for clients.
    unit_id: z.string().uuid().optional(),
    requested_by: z.string().uuid().optional(),
    assigned_to: z.string().uuid().optional(),
    title: z.string().trim().min(1).max(500),
    description: z.string().trim().max(5000).optional(),
    priority: maintenancePriorityEnum.optional(),
    estimated_cost: optionalMoneyNumber,
});

// -------------------------------------------
// Update Maintenance Request
// -------------------------------------------
export const updateMaintenanceSchema = z.object({
    unit_id: z.string().uuid().optional(),
    requested_by: z.string().uuid().nullable().optional(),
    assigned_to: z.string().uuid().nullable().optional(),
    title: z.string().trim().min(1).max(500).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    priority: maintenancePriorityEnum.optional(),
    status: maintenanceStatusEnum.optional(),
    estimated_cost: nullableMoneyNumber,
    actual_cost: nullableMoneyNumber,
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
