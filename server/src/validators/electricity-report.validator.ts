import { z } from "zod";

const YYYY_MM_REGEX = /^\d{4}-\d{2}$/;

export const electricityReportQuerySchema = z.object({
    from_month: z.string().regex(YYYY_MM_REGEX).optional(),
    to_month: z.string().regex(YYYY_MM_REGEX).optional(),
});

export type ElectricityReportQueryParams = z.infer<typeof electricityReportQuerySchema>;
