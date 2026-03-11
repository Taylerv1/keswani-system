import { Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { supabaseAdmin } from "../config/supabase";
import {
    createClientSchema,
    updateClientSchema,
    clientQuerySchema,
} from "../validators/client.validator";
import { AuthenticatedRequest, ApiResponse } from "../types";

const normalizeOptionalString = (
    value: string | null | undefined
): string | null | undefined => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
};

const AUTH_USER_SEARCH_PAGE_SIZE = 200;
const AUTH_USER_SEARCH_MAX_PAGES = 10;

function getResetRedirectTo(): string {
    const frontendUrl =
        process.env.FRONTEND_URL ||
        process.env.NEXT_PUBLIC_FRONTEND_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000";

    return `${frontendUrl.replace(/\/+$/, "")}/reset-password`;
}

function getInviteRedirectTo(): string {
    const frontendUrl =
        process.env.FRONTEND_URL ||
        process.env.NEXT_PUBLIC_FRONTEND_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000";

    return `${frontendUrl.replace(/\/+$/, "")}/accept-invite`;
}

function isAlreadyRegisteredError(message: string): boolean {
    const normalized = message.toLowerCase();
    return normalized.includes("already") && normalized.includes("registered");
}

function formatSupabaseAuthError(error: unknown): string {
    if (!error) return "Unknown auth error";

    if (typeof error === "string") {
        const trimmed = error.trim();
        return trimmed.length > 0 ? trimmed : "Unknown auth error";
    }

    if (error instanceof Error) {
        const trimmed = error.message.trim();
        return trimmed.length > 0 ? trimmed : "Unknown auth error";
    }

    if (typeof error === "object") {
        const e = error as Record<string, unknown>;
        const message =
            typeof e.message === "string" && e.message.trim().length > 0
                ? e.message.trim()
                : null;
        const code = typeof e.code === "string" ? e.code : null;
        const details =
            typeof e.details === "string" && e.details.trim().length > 0
                ? e.details.trim()
                : null;
        const hint =
            typeof e.hint === "string" && e.hint.trim().length > 0
                ? e.hint.trim()
                : null;
        const status =
            typeof e.status === "number" || typeof e.status === "string"
                ? String(e.status)
                : null;

        const fallbackObject = (() => {
            try {
                const serialized = JSON.stringify(e);
                return serialized && serialized !== "{}" ? serialized : null;
            } catch {
                return null;
            }
        })();

        return (
            [message, code ? `code=${code}` : null, status ? `status=${status}` : null, details, hint, fallbackObject]
                .filter((part): part is string => Boolean(part))
                .join(" | ") || "Unknown auth error"
        );
    }

    return "Unknown auth error";
}

async function findAuthUserByEmail(email: string): Promise<{ id: string } | null> {
    const normalizedEmail = email.trim().toLowerCase();

    for (let page = 1; page <= AUTH_USER_SEARCH_MAX_PAGES; page += 1) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage: AUTH_USER_SEARCH_PAGE_SIZE,
        });

        if (error) {
            throw new Error(`Failed to query auth users: ${error.message}`);
        }

        const users = data?.users ?? [];
        const matched = users.find(
            (user) => (user.email ?? "").trim().toLowerCase() === normalizedEmail
        );

        if (matched) {
            return { id: matched.id };
        }

        if (users.length < AUTH_USER_SEARCH_PAGE_SIZE) {
            break;
        }
    }

    return null;
}

async function ensureAuthUserIsUniqueForClient(
    authUserId: string,
    clientId: string
): Promise<void> {
    const linkedClient = await prisma.clients.findFirst({
        where: {
            auth_user_id: authUserId,
            deleted_at: null,
            id: { not: clientId },
        },
        select: { id: true, full_name: true, email: true },
    });

    if (!linkedClient) return;

    throw new Error(
        `Auth user is already linked to another tenant (${linkedClient.full_name})`
    );
}

/**
 * GET /api/clients
 * List clients with search + pagination.
 * Enriches each client with their active contract info (property, unit, rent).
 */
export const getClients = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = clientQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Invalid query params", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const { page, limit, search, contract_presence } = parsed.data;
        const skip = (page - 1) * limit;

        const where: Prisma.clientsWhereInput = { deleted_at: null };
        if (search) {
            where.OR = [
                { full_name: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
                { email: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
                { phone: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
            ];
        }

        if (contract_presence === "with_contract") {
            where.contracts = {
                some: {
                    status: "active",
                    deleted_at: null,
                },
            };
        } else if (contract_presence === "without_contract") {
            where.contracts = {
                none: {
                    status: "active",
                    deleted_at: null,
                },
            };
        }

        const [clients, total] = await Promise.all([
            prisma.clients.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: "desc" },
                include: {
                    contracts: {
                        where: { status: "active", deleted_at: null },
                        take: 1,
                        orderBy: { start_date: "desc" },
                        include: {
                            unit: {
                                select: {
                                    id: true,
                                    unit_number: true,
                                    property_id: true,
                                    property: {
                                        select: { id: true, name: true },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
            prisma.clients.count({ where }),
        ]);

        const enriched = clients.map((cli) => {
            const ac = cli.contracts[0] || null;
            return {
                id: cli.id,
                auth_user_id: cli.auth_user_id,
                full_name: cli.full_name,
                email: cli.email,
                phone: cli.phone,
                notes: cli.notes,
                active_contract: ac
                    ? {
                        id: ac.id,
                        property_id: ac.unit.property_id,
                        property_name: ac.unit.property.name,
                        unit_id: ac.unit.id,
                        unit_number: ac.unit.unit_number,
                        monthly_rent: ac.monthly_rent,
                        currency: ac.currency,
                        start_date: ac.start_date,
                        end_date: ac.end_date,
                        status: ac.status,
                    }
                    : null,
                created_at: cli.created_at,
                updated_at: cli.updated_at,
            };
        });

        res.json({
            success: true,
            data: {
                items: enriched,
                pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/clients/:id
 * Single client with all contracts + payment summary.
 */
export const getClientById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const client = await prisma.clients.findFirst({
            where: { id, deleted_at: null },
            include: {
                contracts: {
                    where: { deleted_at: null },
                    orderBy: { start_date: "desc" },
                    include: {
                        unit: {
                            select: {
                                id: true,
                                unit_number: true,
                                property: { select: { id: true, name: true } },
                            },
                        },
                        rent_payments: {
                            where: { deleted_at: null },
                            orderBy: { payment_date: "desc" },
                            take: 10,
                            select: {
                                id: true,
                                amount: true,
                                currency: true,
                                payment_date: true,
                                paid_at: true,
                                status: true,
                                period_start: true,
                                period_end: true,
                            },
                        },
                    },
                },
                maintenance_requests: {
                    where: { deleted_at: null },
                    orderBy: { created_at: "desc" },
                    take: 5,
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                        created_at: true,
                    },
                },
            },
        });

        if (!client) {
            res.status(404).json({ success: false, error: "Client not found" });
            return;
        }

        const { address: _address, ...clientWithoutAddress } = client;

        res.json({ success: true, data: clientWithoutAddress } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/clients
 * Create a new client.
 */
export const createClient = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = createClientSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const fullName = parsed.data.full_name.trim();
        const email = normalizeOptionalString(parsed.data.email)?.toLowerCase() ?? null;
        const phone = normalizeOptionalString(parsed.data.phone) ?? null;
        const notes = normalizeOptionalString(parsed.data.notes) ?? null;

        if (email) {
            const emailExists = await prisma.clients.findFirst({
                where: {
                    email: { equals: email, mode: "insensitive" as Prisma.QueryMode },
                    deleted_at: null,
                },
            });
            if (emailExists) {
                res.status(409).json({ success: false, error: "A client with this email already exists" });
                return;
            }
        }

        const client = await prisma.clients.create({
            data: {
                full_name: fullName,
                email,
                phone,
                notes,
            },
        });

        res.status(201).json({
            success: true,
            data: client,
            message: "Client created successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/clients/:id
 * Update client fields.
 */
export const updateClient = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.clients.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            res.status(404).json({ success: false, error: "Client not found" });
            return;
        }

        const parsed = updateClientSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const normalizedEmail = normalizeOptionalString(parsed.data.email)?.toLowerCase();

        if (parsed.data.email !== undefined && normalizedEmail && normalizedEmail !== existing.email) {
            const emailExists = await prisma.clients.findFirst({
                where: {
                    email: { equals: normalizedEmail, mode: "insensitive" as Prisma.QueryMode },
                    deleted_at: null,
                    id: { not: id },
                },
            });
            if (emailExists) {
                res.status(409).json({ success: false, error: "A client with this email already exists" });
                return;
            }
        }

        const normalizedData: Prisma.clientsUpdateInput = {};

        if (parsed.data.full_name !== undefined) {
            normalizedData.full_name = parsed.data.full_name.trim();
        }

        if (parsed.data.email !== undefined) {
            normalizedData.email = normalizedEmail ?? null;
        }

        if (parsed.data.phone !== undefined) {
            normalizedData.phone = normalizeOptionalString(parsed.data.phone) ?? null;
        }

        if (parsed.data.notes !== undefined) {
            normalizedData.notes = normalizeOptionalString(parsed.data.notes) ?? null;
        }

        const client = await prisma.clients.update({
            where: { id },
            data: normalizedData,
        });

        res.json({
            success: true,
            data: client,
            message: "Client updated successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/clients/:id
 * Soft delete — only if the client has no contract history.
 * Legal/accounting history must remain intact once contracts exist.
 */
export const deleteClient = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.clients.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            res.status(404).json({ success: false, error: "Client not found" });
            return;
        }

        const contractHistoryCount = await prisma.contracts.count({
            where: { client_id: id, deleted_at: null },
        });

        if (contractHistoryCount > 0) {
            res.status(409).json({
                success: false,
                error:
                    "Cannot delete tenant: contract history exists. Keep tenant record for legal/accounting tracking.",
            });
            return;
        }

        await prisma.clients.update({
            where: { id },
            data: { deleted_at: new Date() },
        });

        res.json({ success: true, message: "Client has been soft-deleted" } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/clients/:id/invite
 * Ensures tenant has an auth account and sends an access email.
 * First-time invite uses Supabase invite flow.
 * Existing account uses reset-password flow to resend access link.
 */
export const inviteClientAccess = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const client = await prisma.clients.findFirst({
            where: { id, deleted_at: null },
            select: {
                id: true,
                full_name: true,
                email: true,
                auth_user_id: true,
            },
        });

        if (!client) {
            res.status(404).json({ success: false, error: "Client not found" });
            return;
        }

        const normalizedEmail = normalizeOptionalString(client.email)?.toLowerCase() ?? null;
        if (!normalizedEmail) {
            res.status(409).json({
                success: false,
                error: "Client email is required before sending access link",
            });
            return;
        }

        let authUserId = client.auth_user_id;

        if (authUserId) {
            const { error: syncError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
                email: normalizedEmail,
                user_metadata: {
                    full_name: client.full_name,
                },
            });

            if (syncError) {
                authUserId = null;
            }
        }

        if (!authUserId) {
            const existingUser = await findAuthUserByEmail(normalizedEmail);
            if (existingUser) {
                authUserId = existingUser.id;
            }
        }

        if (!authUserId) {
            const { data: invitedUser, error: inviteError } =
                await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
                    redirectTo: getInviteRedirectTo(),
                    data: {
                        full_name: client.full_name,
                    },
                });

            if (inviteError) {
                const inviteErrorMessage = formatSupabaseAuthError(inviteError);

                if (isAlreadyRegisteredError(inviteErrorMessage)) {
                    const existingUser = await findAuthUserByEmail(normalizedEmail);
                    if (!existingUser) {
                        res.status(409).json({
                            success: false,
                            error: "Tenant auth account exists but could not be linked automatically",
                        });
                        return;
                    }

                    authUserId = existingUser.id;
                } else {
                    res.status(500).json({
                        success: false,
                        error: `Failed to invite tenant auth account: ${inviteErrorMessage}`,
                    });
                    return;
                }
            } else {
                authUserId = invitedUser.user?.id ?? null;

                if (!authUserId) {
                    const createdUser = await findAuthUserByEmail(normalizedEmail);
                    authUserId = createdUser?.id ?? null;
                }

                if (!authUserId) {
                    res.status(500).json({
                        success: false,
                        error: "Failed to resolve invited tenant auth account",
                    });
                    return;
                }

                try {
                    await ensureAuthUserIsUniqueForClient(authUserId, client.id);
                } catch (error) {
                    res.status(409).json({
                        success: false,
                        error: error instanceof Error ? error.message : "Auth account link conflict",
                    });
                    return;
                }

                if (client.auth_user_id !== authUserId || client.email !== normalizedEmail) {
                    await prisma.clients.update({
                        where: { id: client.id },
                        data: {
                            auth_user_id: authUserId,
                            email: normalizedEmail,
                        },
                    });
                }

                res.json({
                    success: true,
                    message: "Tenant invitation email sent successfully",
                    data: {
                        client_id: client.id,
                        email: normalizedEmail,
                        auth_user_id: authUserId,
                        delivery: "invite",
                    },
                } as ApiResponse);
                return;
            }
        }

        if (!authUserId) {
            res.status(500).json({
                success: false,
                error: "Failed to resolve tenant auth account",
            });
            return;
        }

        try {
            await ensureAuthUserIsUniqueForClient(authUserId, client.id);
        } catch (error) {
            res.status(409).json({
                success: false,
                error: error instanceof Error ? error.message : "Auth account link conflict",
            });
            return;
        }

        if (client.auth_user_id !== authUserId || client.email !== normalizedEmail) {
            await prisma.clients.update({
                where: { id: client.id },
                data: {
                    auth_user_id: authUserId,
                    email: normalizedEmail,
                },
            });
        }

        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
            normalizedEmail,
            {
                redirectTo: getInviteRedirectTo(),
            }
        );

        if (resetError) {
            const resetErrorMessage = formatSupabaseAuthError(resetError);
            res.status(500).json({
                success: false,
                error: `Failed to send access email: ${resetErrorMessage}`,
            });
            return;
        }

        res.json({
            success: true,
            message: "Tenant access reset link sent successfully",
            data: {
                client_id: client.id,
                email: normalizedEmail,
                auth_user_id: authUserId,
                delivery: "reset",
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};
