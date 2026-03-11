import { z } from "zod";

// Enums matching Prisma schema
const contractStatusEnum = z.enum(["pending", "active", "expired", "terminated"]);

// -------------------------------------------
// Create Contract
// -------------------------------------------
export const createContractSchema = z.object({
    unit_id: z.string().uuid(),
    client_id: z.string().uuid(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
    monthly_rent: z.number().positive(),
    currency: z.string().min(1).max(10).default("USD"),
    deposit_amount: z.number().min(0).default(0),
    status: contractStatusEnum.default("pending"),
    notes: z.string().max(2000).optional(),
});

// -------------------------------------------
// Update Contract
// -------------------------------------------
export const updateContractSchema = z.object({
    unit_id: z.string().uuid().optional(),
    client_id: z.string().uuid().optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    monthly_rent: z.number().positive().optional(),
    currency: z.string().min(1).max(10).optional(),
    deposit_amount: z.number().min(0).optional(),
    status: contractStatusEnum.optional(),
    notes: z.string().max(2000).nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

// -------------------------------------------
// Query Params
// -------------------------------------------
export const contractQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional(),
    status: contractStatusEnum.optional(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type ContractQueryParams = z.infer<typeof contractQuerySchema>;
