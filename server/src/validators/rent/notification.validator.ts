import { z } from "zod";

const notificationChannelEnum = z.enum(["email", "whatsapp", "in_app"]);
const notificationStatusEnum = z.enum(["pending", "sent", "failed"]);

export const notificationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    channel: notificationChannelEnum.optional(),
    status: notificationStatusEnum.optional(),
    recipient_type: z.enum(["client", "employee"]).optional(),
    related_entity_type: z.string().optional(),
});

export const createNotificationSchema = z.object({
    recipient_type: z.enum(["client", "employee"]),
    recipient_id: z.string().uuid(),
    channel: notificationChannelEnum.default("in_app"),
    subject: z.string().min(1).max(500),
    body: z.string().max(5000).optional(),
    status: notificationStatusEnum.default("pending"),
    scheduled_at: z.string().datetime().optional(),
    related_entity_type: z.string().max(100).optional(),
    related_entity_id: z.string().uuid().optional(),
});

export const updateNotificationSchema = z.object({
    subject: z.string().min(1).max(500).optional(),
    body: z.string().max(5000).optional(),
    status: notificationStatusEnum.optional(),
    sent_at: z.string().datetime().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
});
