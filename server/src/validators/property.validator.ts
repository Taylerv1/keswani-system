import { z } from "zod";

// ===========================
// Unit sub-schema (for creating units when adding a building)
// ===========================
const unitSchema = z.object({
    unit_number: z.string().min(1, "Unit number is required"),
    floor: z.number().int().optional(),
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.number().int().min(0).optional(),
    area_sqm: z.number().positive().optional(),
    description: z.string().optional(),
});

// Unit update schema: includes optional id for existing units
const unitUpdateSchema = unitSchema.extend({
    id: z.string().uuid().optional(),
});

const propertyUsageSchema = z.object({
    is_for_rent: z.boolean().optional(),
    is_for_electricity: z.boolean().optional(),
});

// ===========================
// Create Property
// ===========================
export const createPropertySchema = z
    .object({
        name: z.string().min(1, "Property name is required"),
        address: z.string().optional(),
        city: z.string().optional(),
        type: z.enum(["building", "house", "land", "commercial"]),
        managed_by: z.string().uuid().optional(),
        owner_notes: z.string().optional(),
        ...propertyUsageSchema.shape,
        // Optional: create units alongside the property (mainly for buildings)
        units: z.array(unitSchema).optional(),
    })
    .superRefine((data, ctx) => {
        const isForRent = data.is_for_rent ?? true;
        const isForElectricity = data.is_for_electricity ?? true;

        if (!isForRent && !isForElectricity) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Property must be enabled for rent, electricity, or both",
                path: ["is_for_rent"],
            });
        }
    });

// ===========================
// Update Property
// ===========================
export const updatePropertySchema = z.object({
    name: z.string().min(1).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    type: z.enum(["building", "house", "land", "commercial"]).optional(),
    managed_by: z.string().uuid().nullable().optional(),
    owner_notes: z.string().nullable().optional(),
    ...propertyUsageSchema.shape,
    // Allow editing existing units (provide id) and/or adding new units (no id)
    units: z.array(unitUpdateSchema).optional(),
});

// ===========================
// Add Units to existing property
// ===========================
export const addUnitsSchema = z.object({
    units: z.array(unitSchema).min(1, "At least one unit is required"),
});

// ===========================
// Query params
// ===========================
export const propertyQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().optional(),
    type: z.enum(["building", "house", "land", "commercial"]).optional(),
    status: z.enum(["full", "vacant"]).optional(),
    usage: z.enum(["rent", "electricity", "all"]).default("rent"),
});

export const propertyLookupQuerySchema = z.object({
    usage: z.enum(["rent", "electricity", "all"]).default("rent"),
});

export const electricityBuildingsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type AddUnitsInput = z.infer<typeof addUnitsSchema>;
export type PropertyQuery = z.infer<typeof propertyQuerySchema>;
export type PropertyLookupQuery = z.infer<typeof propertyLookupQuerySchema>;
export type ElectricityBuildingsQuery = z.infer<typeof electricityBuildingsQuerySchema>;
