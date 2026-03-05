import { z } from "zod";

export const lookupResourceEnum = z.enum(["properties", "clients", "employees"]);
export const lookupContextEnum = z.enum(["contract", "maintenance", "electricity"]);

export const lookupQuerySchema = z.object({
    resources: z.string().optional(),
    context: lookupContextEnum.optional(),
});

export type LookupResource = z.infer<typeof lookupResourceEnum>;
export type LookupContext = z.infer<typeof lookupContextEnum>;
