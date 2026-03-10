import { Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import {
    createIssueSchema,
    updateIssueSchema,
    issueQuerySchema,
} from "../validators/electricity-issues.validator";
import { AuthenticatedRequest, ApiResponse } from "../types";

// Shared include for enriched issue responses
const issueInclude = {
    subscriber: {
        select: {
            id: true,
            subscription_number: true,
            client_id: true,
            property: { select: { id: true, name: true } },
            unit: { select: { id: true, unit_number: true } },
        },
    },
    client: {
        select: { id: true, full_name: true },
    },
    assignee: {
        select: { id: true, full_name: true },
    },
} as const;

type IssueWithRelations = Prisma.electricity_issuesGetPayload<{
    include: typeof issueInclude;
}>;

function hasElectricityAccess(access: Prisma.JsonValue | null): boolean {
    if (!access || typeof access !== "object" || Array.isArray(access)) return false;
    const raw = (access as Record<string, unknown>).electricity;
    if (typeof raw === "boolean") return raw;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
    return (raw as Record<string, unknown>).enabled === true;
}

function formatIssueStatus(status: string): string {
    if (status === "open") return "Open";
    if (status === "in_progress") return "In Progress";
    if (status === "resolved") return "Resolved";
    if (status === "closed") return "Closed";
    return status;
}

function formatIssuePriority(priority: string): string {
    if (priority === "high") return "High";
    if (priority === "medium") return "Medium";
    if (priority === "low") return "Low";
    return priority;
}

function formatIssueCategory(category: string): string {
    if (category === "billing") return "Billing";
    if (category === "meter") return "Meter";
    if (category === "connection") return "Connection";
    if (category === "other") return "Other";
    return category;
}

async function notifyElectricityEmployeesOfNewIssue(
    issue: IssueWithRelations
): Promise<void> {
    const employees = await prisma.employees.findMany({
        where: { deleted_at: null, is_active: true },
        select: { id: true, role: true, access: true },
    });

    const recipientIds = employees
        .filter(
            (employee) =>
                employee.role === "owner" ||
                employee.role === "admin" ||
                hasElectricityAccess(employee.access)
        )
        .map((employee) => employee.id);

    if (recipientIds.length === 0) return;

    const clientName = issue.client?.full_name || "Subscriber";
    const subscriptionNumber = issue.subscriber?.subscription_number || "N/A";
    const category = formatIssueCategory(issue.category);

    await prisma.notifications.createMany({
        data: recipientIds.map((recipientId) => ({
            recipient_type: "employee",
            recipient_id: recipientId,
            channel: "in_app" as const,
            section: "electricity",
            notification_type: "electricity_issue",
            subject: "New Electricity Issue",
            body: `${clientName} reported a ${category} issue: "${issue.title}" (Subscription: ${subscriptionNumber}).`,
            related_entity_type: "electricity_issue",
            related_entity_id: issue.id,
            status: "sent" as const,
        })),
    });
}

async function notifyRequesterIssueUpdated(
    issue: IssueWithRelations,
    options: {
        statusChanged: boolean;
        priorityChanged: boolean;
        assigneeChanged: boolean;
    }
): Promise<void> {
    if (!issue.client_id) return;

    const details: string[] = [];

    if (options.statusChanged) {
        details.push(`Status: ${formatIssueStatus(issue.status)}`);
    }
    if (options.priorityChanged) {
        details.push(`Priority: ${formatIssuePriority(issue.priority)}`);
    }
    if (options.assigneeChanged) {
        details.push(
            issue.assignee?.full_name
                ? `Assigned To: ${issue.assignee.full_name}`
                : "Assigned To: Unassigned"
        );
    }

    const detailsText =
        details.length > 0 ? ` ${details.join(" | ")}.` : " Please check latest updates.";

    await prisma.notifications.create({
        data: {
            recipient_type: "client",
            recipient_id: issue.client_id,
            channel: "in_app",
            section: "electricity",
            notification_type: "electricity_issue",
            subject: "Electricity Issue Updated",
            body: `Your issue "${issue.title}" was updated.${detailsText}`,
            related_entity_type: "electricity_issue",
            related_entity_id: issue.id,
            status: "sent",
        },
    });
}

function formatIssueItem(issue: IssueWithRelations) {
    return {
        id: issue.id,
        subscriber_id: issue.subscriber_id,
        subscription_number: issue.subscriber?.subscription_number || null,
        property_name: issue.subscriber?.property?.name || null,
        unit_number: issue.subscriber?.unit?.unit_number || null,
        client_id: issue.client_id,
        client_name: issue.client?.full_name || null,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        status: issue.status,
        priority: issue.priority,
        assigned_to: issue.assigned_to,
        assignee_name: issue.assignee?.full_name || null,
        resolved_at: issue.resolved_at,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
    };
}

/**
 * GET /api/electricity-issues
 * List electricity issues with status/priority/category filters, search, pagination.
 */
export const getIssues = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = issueQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Invalid query params",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { page, limit, search, status, priority, category } = parsed.data;
        const skip = (page - 1) * limit;

        const where: Prisma.electricity_issuesWhereInput = { deleted_at: null };

        // Clients can only see their own issues
        if (req.user?.user_type === "client") {
            where.client_id = req.user.profile_id;
        }

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (category) where.category = category;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
                { description: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
                { client: { full_name: { contains: search, mode: "insensitive" as Prisma.QueryMode } } },
                { subscriber: { subscription_number: { contains: search, mode: "insensitive" as Prisma.QueryMode } } },
            ];
        }

        const [issues, total] = await Promise.all([
            prisma.electricity_issues.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: "desc" },
                include: issueInclude,
            }),
            prisma.electricity_issues.count({ where }),
        ]);

        const items = issues.map(formatIssueItem);

        res.json({
            success: true,
            data: {
                items,
                pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/electricity-issues/:id
 * Single electricity issue with full details.
 */
export const getIssueById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const where: Prisma.electricity_issuesWhereInput = {
            id,
            deleted_at: null,
        };

        if (req.user?.user_type === "client") {
            where.client_id = req.user.profile_id;
        }

        const issue = await prisma.electricity_issues.findFirst({
            where,
            include: issueInclude,
        });

        if (!issue) {
            res.status(404).json({ success: false, error: "Electricity issue not found" });
            return;
        }

        res.json({ success: true, data: formatIssueItem(issue) } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/electricity-issues
 * Create a new electricity issue.
 */
export const createIssue = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = createIssueSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const data = parsed.data;
        const isClient = req.user?.user_type === "client";
        const clientProfileId = isClient ? req.user?.profile_id : undefined;

        // Employees must always provide subscriber_id
        if (!isClient && !data.subscriber_id) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: { subscriber_id: ["Required"] },
            });
            return;
        }

        let resolvedSubscriberId: string;
        let resolvedClientId: string;

        if (isClient && !data.subscriber_id) {
            // Auto-resolve: find the client's active subscriber
            const autoSub = await prisma.subscribers.findFirst({
                where: { client_id: clientProfileId, is_active: true, deleted_at: null },
                select: { id: true, client_id: true },
                orderBy: { created_at: "asc" },
            });
            if (!autoSub) {
                res.status(404).json({
                    success: false,
                    error: "No active electricity subscription found for your account",
                });
                return;
            }
            resolvedSubscriberId = autoSub.id;
            resolvedClientId = autoSub.client_id;
        } else {
            // Validate provided subscriber_id (and scope to client if applicable)
            const subscriberWhere: Prisma.subscribersWhereInput = {
                id: data.subscriber_id,
                deleted_at: null,
            };
            if (isClient) subscriberWhere.client_id = clientProfileId;

            const subscriber = await prisma.subscribers.findFirst({
                where: subscriberWhere,
                select: { id: true, client_id: true },
            });

            if (!subscriber) {
                res.status(404).json({
                    success: false,
                    error: isClient
                        ? "Subscriber not found or does not belong to you"
                        : "Subscriber not found",
                });
                return;
            }
            resolvedSubscriberId = subscriber.id;
            resolvedClientId = isClient ? clientProfileId! : subscriber.client_id;
        }

        const issue = await prisma.electricity_issues.create({
            data: {
                subscriber: { connect: { id: resolvedSubscriberId } },
                client: { connect: { id: resolvedClientId } },
                title: data.title,
                description: data.description || undefined,
                category: data.category,
                priority: isClient ? "medium" : data.priority,
            },
            include: issueInclude,
        });

        try {
            await notifyElectricityEmployeesOfNewIssue(issue);
        } catch (notificationError) {
            console.error("Failed to create electricity issue notification:", notificationError);
        }

        res.status(201).json({
            success: true,
            data: formatIssueItem(issue),
            message: "Electricity issue created successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/electricity-issues/:id
 * Update electricity issue. Auto-sets resolved_at when status → resolved.
 */
export const updateIssue = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.electricity_issues.findFirst({
            where: { id, deleted_at: null },
            include: issueInclude,
        });
        if (!existing) {
            res.status(404).json({ success: false, error: "Electricity issue not found" });
            return;
        }

        const parsed = updateIssueSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const data = parsed.data;
        const statusChanged = data.status !== undefined && data.status !== existing.status;
        const priorityChanged = data.priority !== undefined && data.priority !== existing.priority;
        const assigneeChanged = data.assigned_to !== undefined && data.assigned_to !== existing.assigned_to;

        // Build update input
        const updateData: Prisma.electricity_issuesUpdateInput = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.priority !== undefined) updateData.priority = data.priority;
        if (data.status !== undefined) updateData.status = data.status;

        // Handle assignee relation
        if (data.assigned_to !== undefined) {
            if (data.assigned_to === null) {
                updateData.assignee = { disconnect: true };
            } else {
                updateData.assignee = { connect: { id: data.assigned_to } };
            }
        }

        // Auto-set resolved_at
        if (data.status === "resolved" && existing.status !== "resolved") {
            updateData.resolved_at = new Date();
        } else if (data.status && data.status !== "resolved" && existing.status === "resolved") {
            updateData.resolved_at = null;
        }

        const issue = await prisma.electricity_issues.update({
            where: { id },
            data: updateData,
            include: issueInclude,
        });

        if (statusChanged || priorityChanged || assigneeChanged) {
            try {
                await notifyRequesterIssueUpdated(issue, {
                    statusChanged,
                    priorityChanged,
                    assigneeChanged,
                });
            } catch (notificationError) {
                console.error("Failed to create electricity issue update notification:", notificationError);
            }
        }

        res.json({
            success: true,
            data: formatIssueItem(issue),
            message: "Electricity issue updated successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/electricity-issues/:id
 * Soft delete.
 */
export const deleteIssue = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.electricity_issues.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            res.status(404).json({ success: false, error: "Electricity issue not found" });
            return;
        }

        await prisma.electricity_issues.update({
            where: { id },
            data: { deleted_at: new Date() },
        });

        res.json({ success: true, message: "Electricity issue has been soft-deleted" } as ApiResponse);
    } catch (err) {
        next(err);
    }
};
