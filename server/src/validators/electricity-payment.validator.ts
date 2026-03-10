import { z } from "zod";

const YYYY_MM_DD_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const YYYY_MM_REGEX = /^\d{4}-\d{2}$/;
const UUID_LIKE_REGEX =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const idSchema = z.string().regex(UUID_LIKE_REGEX, "Invalid UUID");
const billPaymentStatusEnum = z.enum(["pending", "paid", "overdue", "cancelled"]);

export const electricityPaymentQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().optional(),
    status: billPaymentStatusEnum.optional(),
    month: z.string().regex(YYYY_MM_REGEX).optional(),
    subscriber_id: idSchema.optional(),
    bill_id: idSchema.optional(),
});

export const createElectricityPaymentSchema = z.object({
    bill_id: idSchema,
    amount: z.coerce.number().positive(),
    currency: z.string().min(1).max(10).default("USD"),
    payment_date: z.string().regex(YYYY_MM_DD_REGEX, "Date must be YYYY-MM-DD").optional(),
    status: billPaymentStatusEnum.default("paid"),
    received_by: idSchema.nullable().optional(),
    receipt_number: z.string().max(100).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
});

export type ElectricityPaymentQueryParams = z.infer<typeof electricityPaymentQuerySchema>;
export type CreateElectricityPaymentInput = z.infer<typeof createElectricityPaymentSchema>;
