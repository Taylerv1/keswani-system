import { z } from "zod";

const YYYY_MM_DD_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const YYYY_MM_REGEX = /^\d{4}-\d{2}$/;
const UUID_LIKE_REGEX =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const idSchema = z.string().regex(UUID_LIKE_REGEX, "Invalid UUID");

export const readingQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().optional(),
    month: z.string().regex(YYYY_MM_REGEX).optional(),
    meter_id: idSchema.optional(),
});

export const createReadingSchema = z.object({
    meter_id: idSchema,
    reading_value: z.coerce.number().min(0),
    reading_date: z.string().regex(YYYY_MM_DD_REGEX).optional(),
    recorded_by: idSchema.nullable().optional(),
    source: z.enum(["manual", "automatic"]).default("manual"),
    notes: z.string().max(5000).nullable().optional(),
});

export type ReadingQueryParams = z.infer<typeof readingQuerySchema>;
export type CreateReadingInput = z.infer<typeof createReadingSchema>;
