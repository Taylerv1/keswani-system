import { z } from "zod";

const YYYY_MM_DD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const meterStatusEnum = z.enum(["active", "inactive"]);
export const meterTypeEnum = z.enum(["residential", "commercial"]);

export const meterQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().optional(),
    status: meterStatusEnum.optional(),
    meter_type: meterTypeEnum.optional(),
    subscriber_id: z.string().uuid().optional(),
});

export const createMeterSchema = z.object({
    subscriber_id: z.string().uuid(),
    meter_number: z.string().min(1).max(100),
    meter_type: meterTypeEnum.default("residential"),
    installation_date: z.string().regex(YYYY_MM_DD_REGEX).nullable().optional(),
    status: meterStatusEnum.default("active"),
});

export const updateMeterSchema = z
    .object({
        subscriber_id: z.string().uuid().optional(),
        meter_number: z.string().min(1).max(100).optional(),
        meter_type: meterTypeEnum.optional(),
        installation_date: z.string().regex(YYYY_MM_DD_REGEX).nullable().optional(),
        status: meterStatusEnum.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field is required",
    });

export type MeterQueryParams = z.infer<typeof meterQuerySchema>;
export type CreateMeterInput = z.infer<typeof createMeterSchema>;
export type UpdateMeterInput = z.infer<typeof updateMeterSchema>;
