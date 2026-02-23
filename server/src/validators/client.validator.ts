import { z } from "zod";

// ===========================
// Create Client
// ===========================
export const createClientSchema = z.object({
    full_name: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    // address: z.string().optional(),
    notes: z.string().optional(),
});

// ===========================
// Update Client
// ===========================
export const updateClientSchema = z.object({
    full_name: z.string().min(1).optional(),
    email: z.string().email("Invalid email").nullable().optional().or(z.literal("")),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
});

// ===========================
// Query params
// ===========================
export const clientQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientQuery = z.infer<typeof clientQuerySchema>;
