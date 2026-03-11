import { z } from "zod";

const subscriberStatusEnum = z.enum(["active", "inactive"]);

// -------------------------------------------
// Create Subscriber
// -------------------------------------------
export const createSubscriberSchema = z.object({
    client_id: z.string().uuid().optional(),
    full_name: z.string().min(1).max(255).optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().max(50).optional().or(z.literal("")),
    subscription_number: z.string().min(1).max(100),
    property_id: z.string().uuid().nullable().optional(),
    unit_id: z.string().uuid().nullable().optional(),
    is_active: z.boolean().optional().default(true),
    notes: z.string().max(5000).optional().or(z.literal("")),
}).refine(
    (data) => Boolean(data.client_id || data.full_name?.trim()),
    {
        message: "full_name is required when client_id is not provided",
        path: ["full_name"],
    }
);

// -------------------------------------------
// Update Subscriber
// -------------------------------------------
export const updateSubscriberSchema = z.object({
    client_id: z.string().uuid().optional(),
    full_name: z.string().min(1).max(255).optional(),
    email: z.string().email("Invalid email").nullable().optional().or(z.literal("")),
    phone: z.string().max(50).nullable().optional(),
    subscription_number: z.string().min(1).max(100).optional(),
    property_id: z.string().uuid().nullable().optional(),
    unit_id: z.string().uuid().nullable().optional(),
    is_active: z.boolean().optional(),
    notes: z.string().max(5000).nullable().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field is required" }
);

// -------------------------------------------
// Query Params
// -------------------------------------------
export const subscriberQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional(),
    status: subscriberStatusEnum.optional(),
});

export type CreateSubscriberInput = z.infer<typeof createSubscriberSchema>;
export type UpdateSubscriberInput = z.infer<typeof updateSubscriberSchema>;
export type SubscriberQueryParams = z.infer<typeof subscriberQuerySchema>;
