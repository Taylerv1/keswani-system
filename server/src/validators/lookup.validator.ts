import { z } from "zod";

export const lookupResourceEnum = z.enum(["properties", "clients"]);

export const lookupQuerySchema = z.object({
    resources: z.string().optional(),
});

export type LookupResource = z.infer<typeof lookupResourceEnum>;
