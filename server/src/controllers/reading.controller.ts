import { NextFunction, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { ApiResponse, AuthenticatedRequest } from "../types";
import {
    createReadingSchema,
    readingQuerySchema,
} from "../validators/reading.validator";

const readingListInclude = {
    meter: {
        select: {
            id: true,
            meter_number: true,
            subscriber_id: true,
            deleted_at: true,
            subscriber: {
                select: {
                    id: true,
                    subscription_number: true,
                    deleted_at: true,
                    client: {
                        select: {
                            id: true,
                            full_name: true,
                        },
                    },
                },
            },
        },
    },
    recorder: {
        select: {
            id: true,
            full_name: true,
        },
    },
} as const;

type ReadingListPayload = Prisma.readingsGetPayload<{ include: typeof readingListInclude }>;

const toNumber = (value: unknown): number => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
};

const formatDateOnly = (value: Date | null | undefined): string | null => {
    if (!value) return null;
    return value.toISOString().slice(0, 10);
};

const addOneDay = (value: Date): Date => {
    const next = new Date(value);
    next.setDate(next.getDate() + 1);
    return next;
};

async function getPreviousReadingValue(
    meterId: string,
    readingDate: Date
): Promise<{ value: number; date: Date } | null> {
    const previous = await prisma.readings.findFirst({
        where: {
            meter_id: meterId,
            reading_date: { lt: readingDate },
        },
        orderBy: [{ reading_date: "desc" }, { created_at: "desc" }],
        select: {
            reading_value: true,
            reading_date: true,
        },
    });

    if (!previous) return null;

    return {
        value: toNumber(previous.reading_value),
        date: previous.reading_date,
    };
}

async function isBillGeneratedForReading(reading: {
    meter_id: string;
    reading_date: Date;
    reading_value: Prisma.Decimal | number;
}): Promise<boolean> {
    const bill = await prisma.bills.findFirst({
        where: {
            meter_id: reading.meter_id,
            deleted_at: null,
            billing_period_end: reading.reading_date,
            current_reading: reading.reading_value,
        },
        select: { id: true },
    });

    return Boolean(bill);
}

async function mapReadingListItem(reading: ReadingListPayload) {
    const previous = await getPreviousReadingValue(reading.meter_id, reading.reading_date);
    const currentReading = toNumber(reading.reading_value);
    const previousReading = previous ? previous.value : currentReading;
    const consumption = Math.max(0, currentReading - previousReading);
    const billGenerated = await isBillGeneratedForReading(reading);

    return {
        id: reading.id,
        meter_id: reading.meter_id,
        meter_number: reading.meter.meter_number,
        subscriber_id: reading.meter.subscriber_id,
        subscriber_name: reading.meter.subscriber.client.full_name,
        subscription_number: reading.meter.subscriber.subscription_number,
        previous_reading: previousReading,
        current_reading: currentReading,
        consumption,
        reading_date: formatDateOnly(reading.reading_date),
        month: formatDateOnly(reading.reading_date)?.slice(0, 7) ?? "",
        recorded_by: reading.recorded_by,
        recorded_by_name: reading.recorder?.full_name ?? null,
        source: reading.source,
        notes: reading.notes,
        bill_generated: billGenerated,
        created_at: reading.created_at,
        updated_at: reading.updated_at,
    };
}

function isUniqueConstraintError(error: unknown): boolean {
    return (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
    );
}

/**
 * GET /api/readings
 * List readings with computed previous reading and consumption.
 */
export const getReadings = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = readingQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Invalid query params",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { page, limit, search, month, meter_id } = parsed.data;
        const skip = (page - 1) * limit;

        const where: Prisma.readingsWhereInput = {
            meter: {
                deleted_at: null,
                subscriber: { deleted_at: null },
            },
        };

        if (meter_id) {
            where.meter_id = meter_id;
        }

        if (month) {
            const monthStart = new Date(`${month}-01`);
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            where.reading_date = {
                gte: monthStart,
                lt: monthEnd,
            };
        }

        if (search) {
            where.OR = [
                {
                    meter: {
                        meter_number: {
                            contains: search,
                            mode: "insensitive" as Prisma.QueryMode,
                        },
                    },
                },
                {
                    meter: {
                        subscriber: {
                            subscription_number: {
                                contains: search,
                                mode: "insensitive" as Prisma.QueryMode,
                            },
                        },
                    },
                },
                {
                    meter: {
                        subscriber: {
                            client: {
                                full_name: {
                                    contains: search,
                                    mode: "insensitive" as Prisma.QueryMode,
                                },
                            },
                        },
                    },
                },
            ];
        }

        const [readings, total] = await Promise.all([
            prisma.readings.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ reading_date: "desc" }, { created_at: "desc" }],
                include: readingListInclude,
            }),
            prisma.readings.count({ where }),
        ]);

        const items = await Promise.all(
            readings.map((reading) => mapReadingListItem(reading))
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
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/readings
 * Create reading and refresh meter cached reading fields.
 */
export const createReading = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = createReadingSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const data = parsed.data;
        const readingDate = data.reading_date
            ? new Date(data.reading_date)
            : new Date();

        const meter = await prisma.meters.findFirst({
            where: {
                id: data.meter_id,
                deleted_at: null,
                is_active: true,
                subscriber: { deleted_at: null },
            },
            select: {
                id: true,
                last_reading_date: true,
            },
        });

        if (!meter) {
            res.status(404).json({ success: false, error: "Active meter not found" });
            return;
        }

        if (data.recorded_by) {
            const recorder = await prisma.employees.findFirst({
                where: {
                    id: data.recorded_by,
                    deleted_at: null,
                    is_active: true,
                },
                select: { id: true },
            });

            if (!recorder) {
                res.status(404).json({ success: false, error: "Employee recorder not found" });
                return;
            }
        }

        const previous = await getPreviousReadingValue(data.meter_id, readingDate);
        const readingValue = data.reading_value;

        if (previous && readingValue < previous.value) {
            res.status(400).json({
                success: false,
                error: "Reading value cannot be less than the previous reading",
            });
            return;
        }

        const createData: Prisma.readingsCreateInput = {
            meter: { connect: { id: data.meter_id } },
            reading_value: new Prisma.Decimal(readingValue),
            reading_date: readingDate,
            source: data.source,
            notes: data.notes ?? null,
        };

        if (data.recorded_by) {
            createData.recorder = { connect: { id: data.recorded_by } };
        }

        const created = await prisma.readings.create({
            data: createData,
            include: readingListInclude,
        });

        if (!meter.last_reading_date || meter.last_reading_date <= readingDate) {
            await prisma.meters.update({
                where: { id: meter.id },
                data: {
                    last_reading_date: readingDate,
                    last_reading_value: new Prisma.Decimal(readingValue),
                },
            });
        }

        const mapped = await mapReadingListItem(created);

        res.status(201).json({
            success: true,
            data: mapped,
            message: "Reading created successfully",
        } as ApiResponse);
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            res.status(409).json({
                success: false,
                error: "A reading already exists for this meter on this date",
            });
            return;
        }

        next(error);
    }
};

/**
 * POST /api/readings/:id/generate-bill
 * Generate bill from reading using active pricing for reading date.
 */
export const generateBillFromReading = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const reading = await prisma.readings.findFirst({
            where: {
                id,
                meter: {
                    deleted_at: null,
                    subscriber: { deleted_at: null },
                },
            },
            select: {
                id: true,
                meter_id: true,
                reading_value: true,
                reading_date: true,
                meter: {
                    select: {
                        meter_number: true,
                        subscriber_id: true,
                    },
                },
            },
        });

        if (!reading) {
            res.status(404).json({ success: false, error: "Reading not found" });
            return;
        }

        const previous = await getPreviousReadingValue(reading.meter_id, reading.reading_date);
        if (!previous) {
            res.status(409).json({
                success: false,
                error: "Cannot generate bill for first reading without previous reading",
            });
            return;
        }

        const currentReading = toNumber(reading.reading_value);
        const previousReading = previous.value;
        const consumption = currentReading - previousReading;

        if (consumption <= 0) {
            res.status(409).json({
                success: false,
                error: "Consumption must be greater than zero to generate a bill",
            });
            return;
        }

        const existingBill = await prisma.bills.findFirst({
            where: {
                meter_id: reading.meter_id,
                deleted_at: null,
                billing_period_end: reading.reading_date,
                current_reading: reading.reading_value,
            },
            select: { id: true },
        });

        if (existingBill) {
            res.status(409).json({
                success: false,
                error: "Bill is already generated for this reading",
            });
            return;
        }

        const pricing = await prisma.pricing_history.findFirst({
            where: {
                effective_from: { lte: reading.reading_date },
                OR: [
                    { effective_to: null },
                    { effective_to: { gte: reading.reading_date } },
                ],
            },
            orderBy: [{ effective_from: "desc" }, { created_at: "desc" }],
        });

        if (!pricing) {
            res.status(409).json({
                success: false,
                error: "No active pricing plan found for reading date",
            });
            return;
        }

        const pricePerKwh = new Prisma.Decimal(pricing.price_per_kwh);
        const consumptionDecimal = new Prisma.Decimal(consumption);
        const totalAmount = consumptionDecimal.mul(pricePerKwh);

        const billCreateData: Prisma.billsCreateInput = {
            meter: { connect: { id: reading.meter_id } },
            subscriber: { connect: { id: reading.meter.subscriber_id } },
            billing_period_start: addOneDay(previous.date),
            billing_period_end: reading.reading_date,
            previous_reading: new Prisma.Decimal(previousReading),
            current_reading: new Prisma.Decimal(currentReading),
            consumption_kwh: consumptionDecimal,
            price_per_kwh: pricePerKwh,
            total_amount: totalAmount,
            currency: pricing.currency,
            status: "pending",
        };

        if (req.user?.user_type === "employee") {
            billCreateData.generator = { connect: { id: req.user.profile_id } };
        }

        const bill = await prisma.bills.create({
            data: billCreateData,
            select: {
                id: true,
                meter_id: true,
                subscriber_id: true,
                billing_period_start: true,
                billing_period_end: true,
                previous_reading: true,
                current_reading: true,
                consumption_kwh: true,
                price_per_kwh: true,
                total_amount: true,
                currency: true,
                status: true,
                created_at: true,
            },
        });

        res.status(201).json({
            success: true,
            message: "Bill generated successfully",
            data: {
                id: bill.id,
                meter_id: bill.meter_id,
                meter_number: reading.meter.meter_number,
                subscriber_id: bill.subscriber_id,
                billing_period_start: formatDateOnly(bill.billing_period_start),
                billing_period_end: formatDateOnly(bill.billing_period_end),
                previous_reading: toNumber(bill.previous_reading),
                current_reading: toNumber(bill.current_reading),
                consumption_kwh: toNumber(bill.consumption_kwh),
                price_per_kwh: toNumber(bill.price_per_kwh),
                total_amount: toNumber(bill.total_amount),
                currency: bill.currency,
                status: bill.status,
                created_at: bill.created_at,
            },
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
};
