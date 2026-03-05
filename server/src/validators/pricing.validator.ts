import { z } from "zod";

const YYYY_MM_DD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const createPricingPlanSchema = z.object({
    name: z.string().min(1).max(120),
    price: z.number().positive(),
    description: z.string().max(2000).default(""),
    features: z.array(z.string().min(1).max(300)).max(50).default([]),
    effective_from: z.string().regex(YYYY_MM_DD_REGEX).optional(),
    effective_to: z.string().regex(YYYY_MM_DD_REGEX).nullable().optional(),
});

export const updatePricingPlanSchema = z
    .object({
        name: z.string().min(1).max(120).optional(),
        price: z.number().positive().optional(),
        description: z.string().max(2000).optional(),
        features: z.array(z.string().min(1).max(300)).max(50).optional(),
        effective_from: z.string().regex(YYYY_MM_DD_REGEX).optional(),
        effective_to: z.string().regex(YYYY_MM_DD_REGEX).nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field is required",
    });

export type CreatePricingPlanInput = z.infer<typeof createPricingPlanSchema>;
export type UpdatePricingPlanInput = z.infer<typeof updatePricingPlanSchema>;
