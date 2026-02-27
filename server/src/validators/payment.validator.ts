import { z } from "zod";

const paymentStatusEnum = z.enum(["pending", "paid", "partial", "overdue", "cancelled"]);

// -------------------------------------------
// Create Rent Payment
// -------------------------------------------
export const createPaymentSchema = z.object({
    contract_id: z.string().uuid(),
    amount: z.number().positive(),
    currency: z.string().min(1).max(10).default("USD"),
    payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: paymentStatusEnum.default("paid"),
    receipt_number: z.string().max(100).optional(),
    notes: z.string().max(2000).optional(),
});

// -------------------------------------------
// Update Rent Payment
// -------------------------------------------
export const updatePaymentSchema = z.object({
    amount: z.number().positive().optional(),
    currency: z.string().min(1).max(10).optional(),
    payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    status: paymentStatusEnum.optional(),
    receipt_number: z.string().max(100).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

// -------------------------------------------
// Query Params
// -------------------------------------------
export const paymentQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional(),
    status: paymentStatusEnum.optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type PaymentQueryParams = z.infer<typeof paymentQuerySchema>;
