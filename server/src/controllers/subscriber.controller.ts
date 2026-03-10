import { NextFunction, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import {
    createSubscriberSchema,
    subscriberQuerySchema,
    updateSubscriberSchema,
} from "../validators/subscriber.validator";
import { ApiResponse, AuthenticatedRequest } from "../types";

const subscriberListInclude = {
    client: {
        select: {
            id: true,
            auth_user_id: true,
            full_name: true,
            email: true,
            phone: true,
        },
    },
    property: {
        select: {
            id: true,
            name: true,
        },
    },
    unit: {
        select: {
            id: true,
            unit_number: true,
        },
    },
} as const;

const subscriberDetailInclude = {
    client: {
        select: {
            id: true,
            auth_user_id: true,
            full_name: true,
            email: true,
            phone: true,
            address: true,
            notes: true,
            created_at: true,
            updated_at: true,
        },
    },
    property: {
        select: {
            id: true,
            name: true,
        },
    },
    unit: {
        select: {
            id: true,
            unit_number: true,
        },
    },
    meters: {
        where: { deleted_at: null },
        orderBy: { created_at: "desc" },
        select: {
            id: true,
            meter_number: true,
            meter_type: true,
            is_active: true,
            installation_date: true,
            last_reading_value: true,
            last_reading_date: true,
        },
    },
} as const;

const normalizeOptionalString = (
    value: string | null | undefined
): string | null | undefined => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
};

const toNumber = (value: unknown): number => {
    if (value === null || value === undefined) return 0;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
};

const mapSubscriberListItem = (
    subscriber: Prisma.subscribersGetPayload<{ include: typeof subscriberListInclude }>,
    meterStats?: { count: number; last_reading_date: Date | null }
) => ({
    id: subscriber.id,
    subscription_number: subscriber.subscription_number,
    is_active: subscriber.is_active,
    notes: subscriber.notes,
    created_at: subscriber.created_at,
    updated_at: subscriber.updated_at,
    client: {
        id: subscriber.client.id,
        auth_user_id: subscriber.client.auth_user_id,
        full_name: subscriber.client.full_name,
        email: subscriber.client.email,
        phone: subscriber.client.phone,
    },
    property: subscriber.property
        ? {
            id: subscriber.property.id,
            name: subscriber.property.name,
        }
        : null,
    unit: subscriber.unit
        ? {
            id: subscriber.unit.id,
            unit_number: subscriber.unit.unit_number,
        }
        : null,
    meters_count: meterStats?.count ?? 0,
    last_reading_date: meterStats?.last_reading_date ?? null,
});

async function ensurePropertyExists(propertyId: string): Promise<void> {
    const property = await prisma.properties.findFirst({
        where: {
            id: propertyId,
            deleted_at: null,
        },
        select: { id: true },
    });

    if (!property) {
        const error = new Error("Property not found") as Error & { statusCode?: number };
        error.statusCode = 404;
        throw error;
    }

    const electricityEnabledProperty = await prisma.properties.findFirst({
        where: {
            id: propertyId,
            deleted_at: null,
            ...( { is_for_electricity: true } as any ),
        },
        select: { id: true },
    });

    if (!electricityEnabledProperty) {
        const error = new Error("Property is not enabled for electricity subscriptions") as Error & { statusCode?: number };
        error.statusCode = 400;
        throw error;
    }
}

async function ensureUnitExists(unitId: string): Promise<{ id: string; property_id: string }> {
    const unit = await prisma.units.findFirst({
        where: {
            id: unitId,
            deleted_at: null,
        },
        select: {
            id: true,
            property_id: true,
        },
    });

    if (!unit) {
        const error = new Error("Unit not found") as Error & { statusCode?: number };
        error.statusCode = 404;
        throw error;
    }

    return unit;
}

async function findOrCreateClient(data: {
    client_id?: string;
    full_name?: string;
    email?: string;
    phone?: string;
}): Promise<{ id: string }> {
    if (data.client_id) {
        const client = await prisma.clients.findFirst({
            where: {
                id: data.client_id,
                deleted_at: null,
            },
            select: { id: true },
        });

        if (!client) {
            const error = new Error("Client not found") as Error & { statusCode?: number };
            error.statusCode = 404;
            throw error;
        }

        const updateData: Prisma.clientsUpdateInput = {};
        const fullName = data.full_name?.trim();
        const email = normalizeOptionalString(data.email)?.toLowerCase();
        const phone = normalizeOptionalString(data.phone);

        if (fullName) updateData.full_name = fullName;
        if (email !== undefined) updateData.email = email ?? null;
        if (phone !== undefined) updateData.phone = phone ?? null;

        if (Object.keys(updateData).length > 0) {
            await prisma.clients.update({
                where: { id: client.id },
                data: updateData,
            });
        }

        return { id: client.id };
    }

    const fullName = data.full_name?.trim();
    const email = normalizeOptionalString(data.email)?.toLowerCase();
    const phone = normalizeOptionalString(data.phone);

    if (!fullName) {
        const error = new Error("Full name is required") as Error & { statusCode?: number };
        error.statusCode = 400;
        throw error;
    }

    if (email) {
        const existingByEmail = await prisma.clients.findFirst({
            where: {
                email: { equals: email, mode: "insensitive" as Prisma.QueryMode },
                deleted_at: null,
            },
            select: { id: true },
        });

        if (existingByEmail) {
            await prisma.clients.update({
                where: { id: existingByEmail.id },
                data: {
                    full_name: fullName,
                    phone: phone ?? null,
                },
            });
            return { id: existingByEmail.id };
        }
    }

    const created = await prisma.clients.create({
        data: {
            full_name: fullName,
            email: email ?? null,
            phone: phone ?? null,
        },
        select: { id: true },
    });

    return created;
}

async function updateLinkedClient(
    clientId: string,
    payload: {
        full_name?: string;
        email?: string | null;
        phone?: string | null;
    }
): Promise<void> {
    const updateData: Prisma.clientsUpdateInput = {};

    if (payload.full_name !== undefined) {
        updateData.full_name = payload.full_name.trim();
    }

    if (payload.email !== undefined) {
        const normalizedEmail = normalizeOptionalString(payload.email)?.toLowerCase() ?? null;

        if (normalizedEmail) {
            const duplicate = await prisma.clients.findFirst({
                where: {
                    id: { not: clientId },
                    deleted_at: null,
                    email: { equals: normalizedEmail, mode: "insensitive" as Prisma.QueryMode },
                },
                select: { id: true },
            });

            if (duplicate) {
                const error = new Error("A client with this email already exists") as Error & {
                    statusCode?: number;
                };
                error.statusCode = 409;
                throw error;
            }
        }

        updateData.email = normalizedEmail;
    }

    if (payload.phone !== undefined) {
        updateData.phone = normalizeOptionalString(payload.phone) ?? null;
    }

    if (Object.keys(updateData).length === 0) return;

    await prisma.clients.update({
        where: { id: clientId },
        data: updateData,
    });
}

/**
 * GET /api/subscribers
 * List electricity subscribers with search + pagination.
 */
export const getSubscribers = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = subscriberQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Invalid query params",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { page, limit, search, status } = parsed.data;
        const skip = (page - 1) * limit;

        const where: Prisma.subscribersWhereInput = {
            deleted_at: null,
        };

        if (status === "active") {
            where.is_active = true;
        } else if (status === "inactive") {
            where.is_active = false;
        }

        if (search) {
            where.OR = [
                {
                    subscription_number: {
                        contains: search,
                        mode: "insensitive" as Prisma.QueryMode,
                    },
                },
                {
                    client: {
                        full_name: {
                            contains: search,
                            mode: "insensitive" as Prisma.QueryMode,
                        },
                    },
                },
                {
                    client: {
                        email: {
                            contains: search,
                            mode: "insensitive" as Prisma.QueryMode,
                        },
                    },
                },
                {
                    client: {
                        phone: {
                            contains: search,
                            mode: "insensitive" as Prisma.QueryMode,
                        },
                    },
                },
                {
                    property: {
                        name: {
                            contains: search,
                            mode: "insensitive" as Prisma.QueryMode,
                        },
                    },
                },
                {
                    unit: {
                        unit_number: {
                            contains: search,
                            mode: "insensitive" as Prisma.QueryMode,
                        },
                    },
                },
            ];
        }

        const [subscribers, total] = await Promise.all([
            prisma.subscribers.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: "desc" },
                include: subscriberListInclude,
            }),
            prisma.subscribers.count({ where }),
        ]);

        const meterStatsEntries = await Promise.all(
            subscribers.map(async (subscriber) => {
                const [count, latest] = await Promise.all([
                    prisma.meters.count({
                        where: {
                            subscriber_id: subscriber.id,
                            deleted_at: null,
                        },
                    }),
                    prisma.meters.findFirst({
                        where: {
                            subscriber_id: subscriber.id,
                            deleted_at: null,
                            last_reading_date: { not: null },
                        },
                        orderBy: { last_reading_date: "desc" },
                        select: { last_reading_date: true },
                    }),
                ]);

                return [
                    subscriber.id,
                    {
                        count,
                        last_reading_date: latest?.last_reading_date ?? null,
                    },
                ] as const;
            })
        );

        const meterStatsMap = new Map(meterStatsEntries);
        const items = subscribers.map((subscriber) =>
            mapSubscriberListItem(subscriber, meterStatsMap.get(subscriber.id))
        );

        res.json({
            success: true,
            data: {
                items,
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
 * GET /api/subscribers/:id
 * Subscriber details + meters + readings + bills + payments.
 */
export const getSubscriberById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const subscriber = await prisma.subscribers.findFirst({
            where: {
                id,
                deleted_at: null,
            },
            include: subscriberDetailInclude,
        });

        if (!subscriber) {
            res.status(404).json({ success: false, error: "Subscriber not found" });
            return;
        }

        const [readings, bills, payments] = await Promise.all([
            prisma.readings.findMany({
                where: {
                    meter: {
                        subscriber_id: id,
                        deleted_at: null,
                    },
                },
                orderBy: [{ reading_date: "desc" }, { created_at: "desc" }],
                take: 50,
                include: {
                    meter: {
                        select: {
                            id: true,
                            meter_number: true,
                        },
                    },
                },
            }),
            prisma.bills.findMany({
                where: {
                    subscriber_id: id,
                    deleted_at: null,
                },
                orderBy: { billing_period_end: "desc" },
                take: 50,
                include: {
                    meter: {
                        select: {
                            id: true,
                            meter_number: true,
                        },
                    },
                    bill_payments: {
                        where: {
                            deleted_at: null,
                        },
                        select: {
                            id: true,
                            amount: true,
                            status: true,
                        },
                    },
                },
            }),
            prisma.bill_payments.findMany({
                where: {
                    deleted_at: null,
                    bill: {
                        subscriber_id: id,
                        deleted_at: null,
                    },
                },
                orderBy: { payment_date: "desc" },
                take: 50,
                select: {
                    id: true,
                    bill_id: true,
                    amount: true,
                    currency: true,
                    payment_date: true,
                    payment_method: true,
                    status: true,
                    receipt_number: true,
                    notes: true,
                    created_at: true,
                    updated_at: true,
                },
            }),
        ]);

        const mappedBills = bills.map((bill) => {
            const paidAmount = bill.bill_payments
                .filter((payment) => payment.status === "paid")
                .reduce((sum, payment) => sum + toNumber(payment.amount), 0);

            const totalAmount = toNumber(bill.total_amount);

            return {
                id: bill.id,
                billing_period_start: bill.billing_period_start,
                billing_period_end: bill.billing_period_end,
                previous_reading: toNumber(bill.previous_reading),
                current_reading: toNumber(bill.current_reading),
                consumption_kwh: toNumber(bill.consumption_kwh),
                price_per_kwh: toNumber(bill.price_per_kwh),
                total_amount: totalAmount,
                currency: bill.currency,
                status: bill.status,
                meter_id: bill.meter_id,
                meter_number: bill.meter.meter_number,
                paid_amount: paidAmount,
                outstanding_amount: Math.max(0, totalAmount - paidAmount),
                created_at: bill.created_at,
                updated_at: bill.updated_at,
            };
        });

        const totalBilled = mappedBills.reduce((sum, bill) => sum + bill.total_amount, 0);
        const totalPaid = mappedBills.reduce((sum, bill) => sum + bill.paid_amount, 0);

        res.json({
            success: true,
            data: {
                id: subscriber.id,
                subscription_number: subscriber.subscription_number,
                is_active: subscriber.is_active,
                notes: subscriber.notes,
                created_at: subscriber.created_at,
                updated_at: subscriber.updated_at,
                client: subscriber.client,
                property: subscriber.property,
                unit: subscriber.unit,
                meters: subscriber.meters.map((meter) => ({
                    id: meter.id,
                    meter_number: meter.meter_number,
                    meter_type: meter.meter_type,
                    is_active: meter.is_active,
                    installation_date: meter.installation_date,
                    last_reading_value: meter.last_reading_value !== null ? toNumber(meter.last_reading_value) : null,
                    last_reading_date: meter.last_reading_date,
                })),
                readings: readings.map((reading) => ({
                    id: reading.id,
                    meter_id: reading.meter_id,
                    meter_number: reading.meter.meter_number,
                    reading_value: toNumber(reading.reading_value),
                    reading_date: reading.reading_date,
                    source: reading.source,
                    notes: reading.notes,
                    created_at: reading.created_at,
                    updated_at: reading.updated_at,
                })),
                bills: mappedBills,
                payments: payments.map((payment) => ({
                    id: payment.id,
                    bill_id: payment.bill_id,
                    amount: toNumber(payment.amount),
                    currency: payment.currency,
                    payment_date: payment.payment_date,
                    payment_method: payment.payment_method,
                    status: payment.status,
                    receipt_number: payment.receipt_number,
                    notes: payment.notes,
                    created_at: payment.created_at,
                    updated_at: payment.updated_at,
                })),
                summary: {
                    total_billed: totalBilled,
                    total_paid: totalPaid,
                    outstanding_balance: Math.max(0, totalBilled - totalPaid),
                },
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/subscribers
 * Create subscriber and create/reuse linked client.
 */
export const createSubscriber = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = createSubscriberSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const data = parsed.data;
        const subscriptionNumber = data.subscription_number.trim();

        let propertyId = data.property_id ?? null;
        let unitId = data.unit_id ?? null;

        if (unitId) {
            const unit = await ensureUnitExists(unitId);
            unitId = unit.id;
            if (propertyId && propertyId !== unit.property_id) {
                res.status(400).json({
                    success: false,
                    error: "Selected unit does not belong to selected property",
                });
                return;
            }
            propertyId = unit.property_id;
        }

        if (propertyId) {
            await ensurePropertyExists(propertyId);
        }

        const client = await findOrCreateClient({
            client_id: data.client_id,
            full_name: data.full_name,
            email: data.email,
            phone: data.phone,
        });

        const existingBySubscription = await prisma.subscribers.findUnique({
            where: { subscription_number: subscriptionNumber },
            include: subscriberListInclude,
        });

        if (existingBySubscription && existingBySubscription.deleted_at === null) {
            res.status(409).json({
                success: false,
                error: "Subscriber with this subscription number already exists",
            });
            return;
        }

        if (existingBySubscription && existingBySubscription.deleted_at !== null) {
            const restored = await prisma.subscribers.update({
                where: { id: existingBySubscription.id },
                data: {
                    client: { connect: { id: client.id } },
                    subscription_number: subscriptionNumber,
                    is_active: data.is_active,
                    notes: normalizeOptionalString(data.notes) ?? null,
                    deleted_at: null,
                    property: propertyId ? { connect: { id: propertyId } } : { disconnect: true },
                    unit: unitId ? { connect: { id: unitId } } : { disconnect: true },
                },
                include: subscriberListInclude,
            });

            res.json({
                success: true,
                data: mapSubscriberListItem(restored),
                message: "Subscriber restored successfully",
            } as ApiResponse);
            return;
        }

        const created = await prisma.subscribers.create({
            data: {
                subscription_number: subscriptionNumber,
                is_active: data.is_active,
                notes: normalizeOptionalString(data.notes) ?? null,
                client: { connect: { id: client.id } },
                ...(propertyId
                    ? {
                        property: {
                            connect: { id: propertyId },
                        },
                    }
                    : {}),
                ...(unitId
                    ? {
                        unit: {
                            connect: { id: unitId },
                        },
                    }
                    : {}),
            },
            include: subscriberListInclude,
        });

        res.status(201).json({
            success: true,
            data: mapSubscriberListItem(created),
            message: "Subscriber created successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/subscribers/:id
 * Update subscriber + linked client info.
 */
export const updateSubscriber = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.subscribers.findFirst({
            where: {
                id,
                deleted_at: null,
            },
            include: {
                client: {
                    select: {
                        id: true,
                    },
                },
                unit: {
                    select: {
                        id: true,
                        property_id: true,
                    },
                },
            },
        });

        if (!existing) {
            res.status(404).json({ success: false, error: "Subscriber not found" });
            return;
        }

        const parsed = updateSubscriberSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const data = parsed.data;

        let nextClientId = existing.client_id;
        if (data.client_id) {
            const targetClient = await prisma.clients.findFirst({
                where: {
                    id: data.client_id,
                    deleted_at: null,
                },
                select: { id: true },
            });

            if (!targetClient) {
                res.status(404).json({ success: false, error: "Client not found" });
                return;
            }

            nextClientId = targetClient.id;
        }

        await updateLinkedClient(nextClientId, {
            full_name: data.full_name,
            email: data.email === "" ? null : data.email,
            phone: data.phone,
        });

        let nextPropertyId = existing.property_id;
        let nextUnitId = existing.unit_id;

        if (data.property_id !== undefined) {
            nextPropertyId = data.property_id;

            if (data.unit_id === undefined && nextUnitId && existing.unit?.property_id !== nextPropertyId) {
                nextUnitId = null;
            }
        }

        if (data.unit_id !== undefined) {
            if (data.unit_id === null) {
                nextUnitId = null;
            } else {
                const unit = await ensureUnitExists(data.unit_id);
                nextUnitId = unit.id;
                if (nextPropertyId && nextPropertyId !== unit.property_id) {
                    res.status(400).json({
                        success: false,
                        error: "Selected unit does not belong to selected property",
                    });
                    return;
                }
                nextPropertyId = unit.property_id;
            }
        }

        if (nextPropertyId) {
            await ensurePropertyExists(nextPropertyId);
        }

        let nextSubscriptionNumber = existing.subscription_number;
        if (data.subscription_number !== undefined) {
            nextSubscriptionNumber = data.subscription_number.trim();
            if (nextSubscriptionNumber !== existing.subscription_number) {
                const duplicate = await prisma.subscribers.findUnique({
                    where: { subscription_number: nextSubscriptionNumber },
                    select: {
                        id: true,
                        deleted_at: true,
                    },
                });

                if (duplicate && duplicate.id !== id) {
                    const duplicateMessage = duplicate.deleted_at
                        ? "Subscription number belongs to an archived subscriber"
                        : "Subscriber with this subscription number already exists";

                    res.status(409).json({
                        success: false,
                        error: duplicateMessage,
                    });
                    return;
                }
            }
        }

        const updateData: Prisma.subscribersUpdateInput = {
            subscription_number: nextSubscriptionNumber,
        };

        if (data.is_active !== undefined) {
            updateData.is_active = data.is_active;
        }

        if (data.notes !== undefined) {
            updateData.notes = normalizeOptionalString(data.notes) ?? null;
        }

        if (nextClientId !== existing.client_id) {
            updateData.client = { connect: { id: nextClientId } };
        }

        updateData.property = nextPropertyId
            ? { connect: { id: nextPropertyId } }
            : { disconnect: true };

        updateData.unit = nextUnitId
            ? { connect: { id: nextUnitId } }
            : { disconnect: true };

        const updated = await prisma.subscribers.update({
            where: { id },
            data: updateData,
            include: subscriberListInclude,
        });

        res.json({
            success: true,
            data: mapSubscriberListItem(updated),
            message: "Subscriber updated successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/subscribers/:id
 * Soft delete subscriber.
 */
export const deleteSubscriber = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.subscribers.findFirst({
            where: {
                id,
                deleted_at: null,
            },
            select: { id: true },
        });

        if (!existing) {
            res.status(404).json({ success: false, error: "Subscriber not found" });
            return;
        }

        await prisma.subscribers.update({
            where: { id },
            data: { deleted_at: new Date() },
        });

        res.json({
            success: true,
            message: "Subscriber has been soft-deleted",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};
