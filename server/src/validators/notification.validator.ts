import { z } from "zod";

export const notificationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    section: z.enum(["rent", "electricity"]).optional(),
    type: z.string().optional(),
    is_read: z
        .enum(["true", "false"])
        .transform((v) => v === "true")
        .optional(),
    search: z.string().optional(),
});

export const createNotificationSchema = z.object({
    recipient_type: z.enum(["client", "employee"]),
    recipient_id: z.string().uuid(),
    channel: z.enum(["email", "whatsapp", "in_app"]).default("in_app"),
    section: z.enum(["rent", "electricity"]).optional(),
    notification_type: z.string().optional(),
    subject: z.string().min(1).max(500),
    subject_ar: z.string().max(500).optional(),
    body: z.string().max(5000).optional(),
    body_ar: z.string().max(5000).optional(),
    related_entity_type: z.string().optional(),
    related_entity_id: z.string().uuid().optional(),
    scheduled_at: z.string().datetime().optional(),
});
