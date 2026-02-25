import { Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma";
import {
    createNotificationSchema,
    updateNotificationSchema,
    notificationQuerySchema,
} from "../../validators/rent/notification.validator";
import { AuthenticatedRequest, ApiResponse } from "../../types";

/**
 * GET /api/rent/notifications
 * List notifications with filters, search, pagination.
 */
export const getNotifications = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = notificationQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Invalid query params", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const { page, limit, search, channel, status, recipient_type, related_entity_type } = parsed.data;
        const skip = (page - 1) * limit;

        const where: Prisma.notificationsWhereInput = {};
        if (channel) where.channel = channel;
        if (status) where.status = status;
        if (recipient_type) where.recipient_type = recipient_type;
        if (related_entity_type) where.related_entity_type = related_entity_type;
        if (search) {
            where.OR = [
                { subject: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
                { body: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
            ];
        }

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notifications.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: "desc" },
            }),
            prisma.notifications.count({ where }),
            prisma.notifications.count({
                where: { ...where, status: "pending" },
            }),
        ]);

        res.json({
            success: true,
            data: {
                items: notifications,
                pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
                unread_count: unreadCount,
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/rent/notifications/:id
 * Single notification.
 */
export const getNotificationById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const notification = await prisma.notifications.findUnique({
            where: { id },
        });

        if (!notification) {
            res.status(404).json({ success: false, error: "Notification not found" });
            return;
        }

        res.json({ success: true, data: notification } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/rent/notifications
 * Create a new notification.
 */
export const createNotification = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = createNotificationSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const data = parsed.data;

        const notification = await prisma.notifications.create({
            data: {
                recipient_type: data.recipient_type,
                recipient_id: data.recipient_id,
                channel: data.channel,
                subject: data.subject,
                body: data.body,
                status: data.status,
                scheduled_at: data.scheduled_at ? new Date(data.scheduled_at) : null,
                related_entity_type: data.related_entity_type,
                related_entity_id: data.related_entity_id,
            },
        });

        res.status(201).json({
            success: true,
            data: notification,
            message: "Notification created successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/rent/notifications/:id
 * Update notification status / content.
 */
export const updateNotification = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.notifications.findUnique({
            where: { id },
        });
        if (!existing) {
            res.status(404).json({ success: false, error: "Notification not found" });
            return;
        }

        const parsed = updateNotificationSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const data = parsed.data;
        const updateData: Record<string, unknown> = {};
        if (data.subject !== undefined) updateData.subject = data.subject;
        if (data.body !== undefined) updateData.body = data.body;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.sent_at !== undefined) updateData.sent_at = new Date(data.sent_at);

        // Auto-set sent_at when marking as sent
        if (data.status === "sent" && !existing.sent_at && !data.sent_at) {
            updateData.sent_at = new Date();
        }

        const notification = await prisma.notifications.update({
            where: { id },
            data: updateData,
        });

        res.json({
            success: true,
            data: notification,
            message: "Notification updated successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/rent/notifications/mark-all-read
 * Mark all pending notifications as sent for the authenticated user.
 */
export const markAllRead = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const recipientId = req.user?.profile_id;
        if (!recipientId) {
            res.status(401).json({ success: false, error: "Unauthorized" });
            return;
        }

        const result = await prisma.notifications.updateMany({
            where: {
                recipient_id: recipientId,
                status: "pending",
            },
            data: {
                status: "sent",
                sent_at: new Date(),
            },
        });

        res.json({
            success: true,
            message: `Marked ${result.count} notification(s) as read`,
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/rent/notifications/:id
 * Hard delete a notification.
 */
export const deleteNotification = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.notifications.findUnique({
            where: { id },
        });
        if (!existing) {
            res.status(404).json({ success: false, error: "Notification not found" });
            return;
        }

        await prisma.notifications.delete({
            where: { id },
        });

        res.json({ success: true, message: "Notification deleted" } as ApiResponse);
    } catch (err) {
        next(err);
    }
};
