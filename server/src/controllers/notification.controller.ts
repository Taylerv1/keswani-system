import { Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import {
    notificationQuerySchema,
    createNotificationSchema,
} from "../validators/notification.validator";
import { AuthenticatedRequest, ApiResponse } from "../types";

/**
 * GET /api/notifications
 * List in-app notifications with filtering by section, type, read status, and search.
 */
export const getNotifications = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = notificationQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Invalid query params",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { page, limit, section, type, is_read, search } = parsed.data;
        const skip = (page - 1) * limit;

        const where: Prisma.notificationsWhereInput = {
            channel: "in_app",
        };

        if (section) where.section = section;
        if (type) where.notification_type = type;
        if (is_read !== undefined) where.is_read = is_read;

        if (search) {
            where.OR = [
                { subject: { contains: search, mode: "insensitive" } },
                { body: { contains: search, mode: "insensitive" } },
            ];
        }

        const [items, total] = await Promise.all([
            prisma.notifications.findMany({
                where,
                orderBy: { created_at: "desc" },
                skip,
                take: limit,
            }),
            prisma.notifications.count({ where }),
        ]);

        const mapped = items.map((n) => ({
            id: n.id,
            type: n.notification_type,
            section: n.section,
            title: n.subject || "",
            message: n.body || "",
            relatedId: n.related_entity_id,
            relatedType: n.related_entity_type,
            read: n.is_read,
            createdAt: n.created_at.toISOString(),
        }));

        res.json({
            success: true,
            data: {
                items: mapped,
                pagination: {
                    page,
                    limit,
                    total,
                    total_pages: Math.ceil(total / limit),
                },
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/notifications/stats
 * Returns unread counts per section.
 */
export const getNotificationStats = async (
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const [rentUnread, electricityUnread, totalUnread] = await Promise.all([
            prisma.notifications.count({
                where: { channel: "in_app", section: "rent", is_read: false },
            }),
            prisma.notifications.count({
                where: { channel: "in_app", section: "electricity", is_read: false },
            }),
            prisma.notifications.count({
                where: { channel: "in_app", is_read: false },
            }),
        ]);

        res.json({
            success: true,
            data: {
                rent_unread: rentUnread,
                electricity_unread: electricityUnread,
                total_unread: totalUnread,
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/notifications
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
            res.status(400).json({
                success: false,
                error: "Invalid request body",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const notification = await prisma.notifications.create({
            data: {
                recipient_type: parsed.data.recipient_type,
                recipient_id: parsed.data.recipient_id,
                channel: parsed.data.channel,
                section: parsed.data.section,
                notification_type: parsed.data.notification_type,
                subject: parsed.data.subject,
                body: parsed.data.body,
                related_entity_type: parsed.data.related_entity_type,
                related_entity_id: parsed.data.related_entity_id,
                scheduled_at: parsed.data.scheduled_at
                    ? new Date(parsed.data.scheduled_at)
                    : undefined,
                status: "sent",
            },
        });

        res.status(201).json({
            success: true,
            data: {
                id: notification.id,
                type: notification.notification_type,
                section: notification.section,
                title: notification.subject,
                message: notification.body,
                read: notification.is_read,
                createdAt: notification.created_at.toISOString(),
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
export const markNotificationRead = async (
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
            res.status(404).json({
                success: false,
                error: "Notification not found",
            });
            return;
        }

        await prisma.notifications.update({
            where: { id },
            data: { is_read: true },
        });

        res.json({ success: true, message: "Notification marked as read" } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read, optionally filtered by section.
 */
export const markAllNotificationsRead = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const section = req.query.section as string | undefined;

        const where: Prisma.notificationsWhereInput = {
            channel: "in_app",
            is_read: false,
        };

        if (section === "rent" || section === "electricity") {
            where.section = section;
        }

        const result = await prisma.notifications.updateMany({
            where,
            data: { is_read: true },
        });

        res.json({
            success: true,
            message: `Marked ${result.count} notification(s) as read`,
            data: { count: result.count },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};
