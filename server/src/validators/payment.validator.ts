import { z } from "zod";

const paymentStatusEnum = z.enum(["pending", "paid", "partial", "overdue", "cancelled"]);
const paymentViewEnum = z.enum(["all", "queue", "history"]);
const YYYY_MM_DD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// -------------------------------------------
// Create Rent Payment
// -------------------------------------------
export const createPaymentSchema = z.object({
    contract_id: z.string().uuid(),
    amount: z.number().positive(),
    currency: z.string().min(1).max(10).default("USD"),
    payment_date: z.string().regex(YYYY_MM_DD_REGEX, "Date must be YYYY-MM-DD").optional(),
    paid_at: z.string().regex(YYYY_MM_DD_REGEX, "Date must be YYYY-MM-DD").optional(),
    period_start: z.string().regex(YYYY_MM_DD_REGEX).optional(),
    period_end: z.string().regex(YYYY_MM_DD_REGEX).optional(),
    status: paymentStatusEnum.default("pending"),
    receipt_number: z.string().max(100).optional(),
    manual_receipt_ref: z.string().max(100).optional(),
    notes: z.string().max(2000).optional(),
}).refine((data) => {
    if (data.period_start && data.period_end) {
        return data.period_start <= data.period_end;
    }
    return true;
}, { message: "period_start must be before or equal to period_end", path: ["period_start"] });

// -------------------------------------------
// Update Rent Payment
// -------------------------------------------
export const updatePaymentSchema = z.object({
    amount: z.number().positive().optional(),
    currency: z.string().min(1).max(10).optional(),
    payment_date: z.string().regex(YYYY_MM_DD_REGEX).optional(),
    paid_at: z.string().regex(YYYY_MM_DD_REGEX).nullable().optional(),
    period_start: z.string().regex(YYYY_MM_DD_REGEX).nullable().optional(),
    period_end: z.string().regex(YYYY_MM_DD_REGEX).nullable().optional(),
    status: paymentStatusEnum.optional(),
    receipt_number: z.string().max(100).nullable().optional(),
    manual_receipt_ref: z.string().max(100).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" })
    .refine((data) => {
        if (data.period_start && data.period_end) {
            return data.period_start <= data.period_end;
        }
        return true;
    }, { message: "period_start must be before or equal to period_end", path: ["period_start"] });

// -------------------------------------------
// Query Params
// -------------------------------------------
export const paymentQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional(),
    status: paymentStatusEnum.optional(),
    view: paymentViewEnum.optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type PaymentQueryParams = z.infer<typeof paymentQuerySchema>;
