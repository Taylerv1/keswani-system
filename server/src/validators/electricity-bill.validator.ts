import { z } from "zod";

const YYYY_MM_REGEX = /^\d{4}-\d{2}$/;
const UUID_LIKE_REGEX =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const idSchema = z.string().regex(UUID_LIKE_REGEX, "Invalid UUID");

export const billStatusFilterEnum = z.enum([
    "paid",
    "pending",
    "partial",
    "overdue",
    "cancelled",
    "open",
]);

export const electricityBillQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().optional(),
    status: billStatusFilterEnum.optional(),
    month: z.string().regex(YYYY_MM_REGEX).optional(),
    subscriber_id: idSchema.optional(),
    meter_id: idSchema.optional(),
});

export type ElectricityBillQueryParams = z.infer<typeof electricityBillQuerySchema>;
