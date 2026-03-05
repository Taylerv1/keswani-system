import { NextFunction, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { ApiResponse, AuthenticatedRequest } from "../types";
import {
    createMeterSchema,
    meterQuerySchema,
    updateMeterSchema,
} from "../validators/meter.validator";

const meterListInclude = {
    subscriber: {
        select: {
            id: true,
            subscription_number: true,
            is_active: true,
            client: {
                select: {
                    id: true,
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
        },
    },
} as const;

type MeterListPayload = Prisma.metersGetPayload<{ include: typeof meterListInclude }>;

const toNumber = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
};

const formatDateOnly = (value: Date | null | undefined): string | null => {
    if (!value) return null;
    return value.toISOString().slice(0, 10);
};

const mapMeterListItem = (meter: MeterListPayload) => ({
    id: meter.id,
    meter_number: meter.meter_number,
    meter_type: meter.meter_type,
    status: meter.is_active ? "active" : "inactive",
    installation_date: formatDateOnly(meter.installation_date),
    last_reading_value: toNumber(meter.last_reading_value),
    last_reading_date: formatDateOnly(meter.last_reading_date),
    created_at: meter.created_at,
    updated_at: meter.updated_at,
    subscriber: {
        id: meter.subscriber.id,
        subscription_number: meter.subscriber.subscription_number,
        is_active: meter.subscriber.is_active,
        client: meter.subscriber.client,
        property: meter.subscriber.property,
        unit: meter.subscriber.unit,
    },
});

async function ensureSubscriberExists(subscriberId: string): Promise<void> {
    const subscriber = await prisma.subscribers.findFirst({
        where: {
            id: subscriberId,
            deleted_at: null,
        },
        select: { id: true },
    });

    if (subscriber) return;

    const error = new Error("Subscriber not found") as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
}

function isUniqueConstraintError(error: unknown): boolean {
    return (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
    );
}

/**
 * GET /api/meters
 * List meters with pagination and filters.
 */
export const getMeters = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = meterQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Invalid query params",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { page, limit, search, status, meter_type, subscriber_id } = parsed.data;
        const skip = (page - 1) * limit;

        const where: Prisma.metersWhereInput = {
            deleted_at: null,
            subscriber: {
                deleted_at: null,
            },
        };

        if (status === "active") {
            where.is_active = true;
        } else if (status === "inactive") {
            where.is_active = false;
        }

        if (meter_type) {
            where.meter_type = meter_type;
        }

        if (subscriber_id) {
            where.subscriber_id = subscriber_id;
        }

        if (search) {
            where.OR = [
                {
                    meter_number: {
                        contains: search,
                        mode: "insensitive" as Prisma.QueryMode,
                    },
                },
                {
                    subscriber: {
                        subscription_number: {
                            contains: search,
                            mode: "insensitive" as Prisma.QueryMode,
                        },
                    },
                },
                {
                    subscriber: {
                        client: {
                            full_name: {
                                contains: search,
                                mode: "insensitive" as Prisma.QueryMode,
                            },
                        },
                    },
                },
                {
                    subscriber: {
                        client: {
                            email: {
                                contains: search,
                                mode: "insensitive" as Prisma.QueryMode,
                            },
                        },
                    },
                },
            ];
        }

        const [meters, total] = await Promise.all([
            prisma.meters.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ created_at: "desc" }],
                include: meterListInclude,
            }),
            prisma.meters.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                items: meters.map((meter) => mapMeterListItem(meter)),
                pagination: {
                    page,
                    limit,
                    total,
                    total_pages: Math.ceil(total / limit),
                },
            },
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/meters/:id
 * Meter details.
 */
export const getMeterById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const meter = await prisma.meters.findFirst({
            where: {
                id,
                deleted_at: null,
                subscriber: { deleted_at: null },
            },
            include: meterListInclude,
        });

        if (!meter) {
            res.status(404).json({ success: false, error: "Meter not found" });
            return;
        }

        res.json({ success: true, data: mapMeterListItem(meter) } as ApiResponse);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/meters
 * Create meter (or restore archived one with same number).
 */
export const createMeter = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = createMeterSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const data = parsed.data;
        const meterNumber = data.meter_number.trim();

        await ensureSubscriberExists(data.subscriber_id);

        const existing = await prisma.meters.findUnique({
            where: { meter_number: meterNumber },
            include: meterListInclude,
        });

        const meterData: Prisma.metersUpdateInput & Prisma.metersCreateInput = {
            meter_number: meterNumber,
            meter_type: data.meter_type,
            is_active: data.status === "active",
            installation_date: data.installation_date
                ? new Date(data.installation_date)
                : null,
            subscriber: {
                connect: { id: data.subscriber_id },
            },
        };

        if (existing && existing.deleted_at !== null) {
            const restored = await prisma.meters.update({
                where: { id: existing.id },
                data: {
                    ...meterData,
                    deleted_at: null,
                },
                include: meterListInclude,
            });

            res.json({
                success: true,
                data: mapMeterListItem(restored),
                message: "Meter restored successfully",
            } as ApiResponse);
            return;
        }

        if (existing && existing.deleted_at === null) {
            res.status(409).json({
                success: false,
                error: "Meter with this number already exists",
            });
            return;
        }

        const created = await prisma.meters.create({
            data: meterData,
            include: meterListInclude,
        });

        res.status(201).json({
            success: true,
            data: mapMeterListItem(created),
            message: "Meter created successfully",
        } as ApiResponse);
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            res.status(409).json({
                success: false,
                error: "Meter with this number already exists",
            });
            return;
        }

        next(error);
    }
};

/**
 * PATCH /api/meters/:id
 * Update meter.
 */
export const updateMeter = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.meters.findFirst({
            where: { id, deleted_at: null },
            select: { id: true, meter_number: true },
        });

        if (!existing) {
            res.status(404).json({ success: false, error: "Meter not found" });
            return;
        }

        const parsed = updateMeterSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const data = parsed.data;

        if (data.subscriber_id) {
            await ensureSubscriberExists(data.subscriber_id);
        }

        const nextMeterNumber = data.meter_number?.trim();
        if (nextMeterNumber && nextMeterNumber !== existing.meter_number) {
            const duplicate = await prisma.meters.findUnique({
                where: { meter_number: nextMeterNumber },
                select: { id: true, deleted_at: true },
            });

            if (duplicate && duplicate.id !== id) {
                const duplicateMessage = duplicate.deleted_at
                    ? "Meter number belongs to an archived meter"
                    : "Meter with this number already exists";
                res.status(409).json({ success: false, error: duplicateMessage });
                return;
            }
        }

        const updateData: Prisma.metersUpdateInput = {};

        if (nextMeterNumber !== undefined) updateData.meter_number = nextMeterNumber;
        if (data.meter_type !== undefined) updateData.meter_type = data.meter_type;
        if (data.status !== undefined) updateData.is_active = data.status === "active";
        if (data.installation_date !== undefined) {
            updateData.installation_date = data.installation_date
                ? new Date(data.installation_date)
                : null;
        }
        if (data.subscriber_id !== undefined) {
            updateData.subscriber = { connect: { id: data.subscriber_id } };
        }

        const updated = await prisma.meters.update({
            where: { id },
            data: updateData,
            include: meterListInclude,
        });

        res.json({
            success: true,
            data: mapMeterListItem(updated),
            message: "Meter updated successfully",
        } as ApiResponse);
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            res.status(409).json({
                success: false,
                error: "Meter with this number already exists",
            });
            return;
        }

        next(error);
    }
};

/**
 * DELETE /api/meters/:id
 * Soft delete meter.
 */
export const deleteMeter = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.meters.findFirst({
            where: { id, deleted_at: null },
            select: { id: true },
        });

        if (!existing) {
            res.status(404).json({ success: false, error: "Meter not found" });
            return;
        }

        await prisma.meters.update({
            where: { id },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        res.json({
            success: true,
            message: "Meter has been soft-deleted",
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
};
