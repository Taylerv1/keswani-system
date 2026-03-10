import { NextFunction, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { ApiResponse, AuthenticatedRequest } from "../types";
import { electricityReportQuerySchema } from "../validators/electricity-report.validator";

const OPEN_BILL_STATUSES: Array<"pending" | "partial" | "overdue"> = [
    "pending",
    "partial",
    "overdue",
];
const SETTLED_PAYMENT_STATUSES: Array<"paid" | "partial"> = ["paid", "partial"];

const debtBillInclude = {
    meter: {
        select: {
            id: true,
            meter_number: true,
        },
    },
    subscriber: {
        select: {
            id: true,
            subscription_number: true,
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

type DebtBillPayload = Prisma.billsGetPayload<{ include: typeof debtBillInclude }>;

function toNumber(value: unknown): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
}

function formatDateOnly(value: Date | null | undefined): string | null {
    if (!value) return null;
    return value.toISOString().slice(0, 10);
}

function toMonth(value: Date | null | undefined): string {
    return formatDateOnly(value)?.slice(0, 7) ?? "";
}

function parseMonthStart(month: string): Date {
    return new Date(`${month}-01T00:00:00.000Z`);
}

function incrementMonth(value: Date): Date {
    const next = new Date(value);
    next.setUTCMonth(next.getUTCMonth() + 1);
    return next;
}

function shiftMonth(value: Date, offset: number): Date {
    const shifted = new Date(value);
    shifted.setUTCMonth(shifted.getUTCMonth() + offset);
    return shifted;
}

function listMonths(fromMonth: string, toMonth: string): string[] {
    const result: string[] = [];
    let cursor = parseMonthStart(fromMonth);
    const end = parseMonthStart(toMonth);

    while (cursor <= end) {
        result.push(cursor.toISOString().slice(0, 7));
        cursor = incrementMonth(cursor);
    }

    return result;
}

/**
 * GET /api/electricity/debts
 * Debt summary grouped by subscriber.
 */
export const getElectricityDebts = async (
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const bills: DebtBillPayload[] = await prisma.bills.findMany({
            where: {
                deleted_at: null,
                status: { in: OPEN_BILL_STATUSES },
                meter: { deleted_at: null },
                subscriber: { deleted_at: null },
            },
            orderBy: [{ billing_period_end: "desc" }, { created_at: "desc" }],
            include: debtBillInclude,
        });

        const paidRows = await prisma.bill_payments.groupBy({
            by: ["bill_id"],
            where: {
                deleted_at: null,
                status: { in: SETTLED_PAYMENT_STATUSES },
                bill: {
                    deleted_at: null,
                    status: { in: OPEN_BILL_STATUSES },
                    meter: { deleted_at: null },
                    subscriber: { deleted_at: null },
                },
            },
            _sum: { amount: true },
        });

        const paidByBillId = new Map<string, number>();
        for (const row of paidRows) {
            paidByBillId.set(row.bill_id, toNumber(row._sum?.amount));
        }

        const bySubscriber = new Map<
            string,
            {
                subscriber: DebtBillPayload["subscriber"];
                total_debt: number;
                unpaid_bills: number;
                bills: Array<{
                    bill_id: string;
                    month: string;
                    meter_number: string;
                    status: DebtBillPayload["status"];
                    total_amount: number;
                    paid_amount: number;
                    outstanding_amount: number;
                }>;
            }
        >();

        for (const bill of bills) {
            const totalAmount = toNumber(bill.total_amount);
            const paidAmount = paidByBillId.get(bill.id) ?? 0;
            const outstandingAmount = Math.max(0, totalAmount - paidAmount);
            if (outstandingAmount <= 0) continue;

            const current = bySubscriber.get(bill.subscriber_id) ?? {
                subscriber: bill.subscriber,
                total_debt: 0,
                unpaid_bills: 0,
                bills: [],
            };

            current.total_debt += outstandingAmount;
            current.unpaid_bills += 1;
            current.bills.push({
                bill_id: bill.id,
                month: toMonth(bill.billing_period_end),
                meter_number: bill.meter.meter_number,
                status: bill.status,
                total_amount: totalAmount,
                paid_amount: paidAmount,
                outstanding_amount: outstandingAmount,
            });

            bySubscriber.set(bill.subscriber_id, current);
        }

        const subscriberIds = Array.from(bySubscriber.keys());
        const latestPayments: Array<{
            payment_date: Date;
            bill: { subscriber_id: string };
        }> = subscriberIds.length
            ? await prisma.bill_payments.findMany({
                where: {
                    deleted_at: null,
                    status: { in: SETTLED_PAYMENT_STATUSES },
                    bill: {
                        subscriber_id: { in: subscriberIds },
                    },
                },
                orderBy: [{ payment_date: "desc" }, { created_at: "desc" }],
                select: {
                    payment_date: true,
                    bill: {
                        select: {
                            subscriber_id: true,
                        },
                    },
                },
            })
            : [];

        const lastPaymentBySubscriber = new Map<string, string>();
        for (const payment of latestPayments) {
            const subscriberId = payment.bill.subscriber_id;
            if (!lastPaymentBySubscriber.has(subscriberId)) {
                const paymentDate = formatDateOnly(payment.payment_date);
                if (paymentDate) {
                    lastPaymentBySubscriber.set(subscriberId, paymentDate);
                }
            }
        }

        const items = Array.from(bySubscriber.entries())
            .map(([subscriberId, entry]) => ({
                subscriber_id: subscriberId,
                subscriber_name: entry.subscriber.client.full_name,
                subscription_number: entry.subscriber.subscription_number,
                subscriber_email: entry.subscriber.client.email,
                subscriber_phone: entry.subscriber.client.phone,
                property: entry.subscriber.property,
                unit: entry.subscriber.unit,
                total_debt: Number(entry.total_debt.toFixed(2)),
                unpaid_bills: entry.unpaid_bills,
                last_payment_date: lastPaymentBySubscriber.get(subscriberId) ?? null,
                bills: entry.bills,
            }))
            .sort((a, b) => b.total_debt - a.total_debt);

        const totalDebt = items.reduce((sum, item) => sum + item.total_debt, 0);
        const totalUnpaidBills = items.reduce((sum, item) => sum + item.unpaid_bills, 0);

        res.json({
            success: true,
            data: {
                summary: {
                    total_debt: Number(totalDebt.toFixed(2)),
                    total_unpaid_bills: totalUnpaidBills,
                    subscribers_in_debt: items.length,
                },
                items,
            },
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/electricity/overview
 * KPI + trend summary for electricity dashboard overview page.
 */
export const getElectricityOverview = async (
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const latestBill = await prisma.bills.findFirst({
            where: {
                deleted_at: null,
                subscriber: { deleted_at: null },
                meter: { deleted_at: null },
            },
            orderBy: { billing_period_end: "desc" },
            select: { billing_period_end: true },
        });

        const fallbackMonth = new Date().toISOString().slice(0, 7);
        const currentMonth = latestBill
            ? toMonth(latestBill.billing_period_end) || fallbackMonth
            : fallbackMonth;

        const currentMonthStart = parseMonthStart(currentMonth);
        const currentMonthEndExclusive = incrementMonth(currentMonthStart);
        const windowStartMonth = shiftMonth(currentMonthStart, -5)
            .toISOString()
            .slice(0, 7);
        const windowStartDate = parseMonthStart(windowStartMonth);
        const windowEndExclusive = currentMonthEndExclusive;
        const months = listMonths(windowStartMonth, currentMonth);

        const [
            activeSubscribers,
            inactiveSubscribers,
            currentMonthBillsAggregate,
            totalConsumptionAggregate,
            totalCollectedAggregate,
            openBillsAggregate,
            openBillsPaidAggregate,
            currentPricing,
            trendBills,
            recentBills,
        ] = await Promise.all([
            prisma.subscribers.count({
                where: {
                    deleted_at: null,
                    is_active: true,
                },
            }),
            prisma.subscribers.count({
                where: {
                    deleted_at: null,
                    is_active: false,
                },
            }),
            prisma.bills.aggregate({
                where: {
                    deleted_at: null,
                    billing_period_end: {
                        gte: currentMonthStart,
                        lt: currentMonthEndExclusive,
                    },
                    subscriber: { deleted_at: null },
                    meter: { deleted_at: null },
                },
                _count: { _all: true },
                _sum: {
                    consumption_kwh: true,
                    total_amount: true,
                },
            }),
            prisma.bills.aggregate({
                where: {
                    deleted_at: null,
                    subscriber: { deleted_at: null },
                    meter: { deleted_at: null },
                },
                _sum: {
                    consumption_kwh: true,
                },
            }),
            prisma.bill_payments.aggregate({
                where: {
                    deleted_at: null,
                    status: { in: SETTLED_PAYMENT_STATUSES },
                    bill: {
                        deleted_at: null,
                        subscriber: { deleted_at: null },
                        meter: { deleted_at: null },
                    },
                },
                _sum: {
                    amount: true,
                },
            }),
            prisma.bills.aggregate({
                where: {
                    deleted_at: null,
                    status: { in: OPEN_BILL_STATUSES },
                    subscriber: { deleted_at: null },
                    meter: { deleted_at: null },
                },
                _sum: {
                    total_amount: true,
                },
            }),
            prisma.bill_payments.aggregate({
                where: {
                    deleted_at: null,
                    status: { in: SETTLED_PAYMENT_STATUSES },
                    bill: {
                        deleted_at: null,
                        status: { in: OPEN_BILL_STATUSES },
                        subscriber: { deleted_at: null },
                        meter: { deleted_at: null },
                    },
                },
                _sum: {
                    amount: true,
                },
            }),
            prisma.pricing_history.findFirst({
                where: {
                    effective_from: { lte: new Date() },
                    OR: [{ effective_to: null }, { effective_to: { gte: new Date() } }],
                },
                orderBy: [{ effective_from: "desc" }, { created_at: "desc" }],
                select: {
                    price_per_kwh: true,
                    currency: true,
                },
            }),
            prisma.bills.findMany({
                where: {
                    deleted_at: null,
                    billing_period_end: {
                        gte: windowStartDate,
                        lt: windowEndExclusive,
                    },
                    subscriber: { deleted_at: null },
                    meter: { deleted_at: null },
                },
                select: {
                    billing_period_end: true,
                    consumption_kwh: true,
                    total_amount: true,
                },
            }),
            prisma.bills.findMany({
                where: {
                    deleted_at: null,
                    subscriber: { deleted_at: null },
                    meter: { deleted_at: null },
                },
                orderBy: [{ created_at: "desc" }],
                take: 5,
                select: {
                    id: true,
                    subscriber_id: true,
                    billing_period_end: true,
                    consumption_kwh: true,
                    total_amount: true,
                    status: true,
                    created_at: true,
                    subscriber: {
                        select: {
                            client: {
                                select: {
                                    full_name: true,
                                },
                            },
                        },
                    },
                },
            }),
        ]);

        const consumptionByMonth = new Map<string, number>();
        const revenueByMonth = new Map<string, number>();
        for (const month of months) {
            consumptionByMonth.set(month, 0);
            revenueByMonth.set(month, 0);
        }

        for (const bill of trendBills) {
            const month = toMonth(bill.billing_period_end);
            if (!consumptionByMonth.has(month)) continue;

            consumptionByMonth.set(
                month,
                (consumptionByMonth.get(month) ?? 0) + toNumber(bill.consumption_kwh)
            );
            revenueByMonth.set(
                month,
                (revenueByMonth.get(month) ?? 0) + toNumber(bill.total_amount)
            );
        }

        const totalDebt = Math.max(
            0,
            toNumber(openBillsAggregate._sum.total_amount) -
                toNumber(openBillsPaidAggregate._sum.amount)
        );

        res.json({
            success: true,
            data: {
                range: {
                    from_month: windowStartMonth,
                    to_month: currentMonth,
                },
                summary: {
                    active_subscribers: activeSubscribers,
                    inactive_subscribers: inactiveSubscribers,
                    suspended_subscribers: 0,
                    monthly_consumption: Number(
                        toNumber(currentMonthBillsAggregate._sum.consumption_kwh).toFixed(2)
                    ),
                    monthly_billed_amount: Number(
                        toNumber(currentMonthBillsAggregate._sum.total_amount).toFixed(2)
                    ),
                    monthly_bills_count: currentMonthBillsAggregate._count._all,
                    collected_amount: Number(
                        toNumber(totalCollectedAggregate._sum.amount).toFixed(2)
                    ),
                    total_debt: Number(totalDebt.toFixed(2)),
                    current_price_per_kwh: currentPricing
                        ? Number(toNumber(currentPricing.price_per_kwh).toFixed(4))
                        : null,
                    current_price_currency: currentPricing?.currency ?? "USD",
                    total_consumption: Number(
                        toNumber(totalConsumptionAggregate._sum.consumption_kwh).toFixed(2)
                    ),
                },
                consumption_by_month: months.map((month) => ({
                    month,
                    consumption_kwh: Number((consumptionByMonth.get(month) ?? 0).toFixed(2)),
                })),
                revenue_by_month: months.map((month) => ({
                    month,
                    total_amount: Number((revenueByMonth.get(month) ?? 0).toFixed(2)),
                })),
                recent_bills: recentBills.map((bill) => ({
                    id: bill.id,
                    subscriber_id: bill.subscriber_id,
                    subscriber_name: bill.subscriber.client.full_name,
                    month: toMonth(bill.billing_period_end),
                    consumption_kwh: Number(toNumber(bill.consumption_kwh).toFixed(2)),
                    total_amount: Number(toNumber(bill.total_amount).toFixed(2)),
                    status: bill.status,
                    created_at: bill.created_at,
                })),
            },
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/electricity/reports
 * Aggregated electricity reporting data.
 */
export const getElectricityReports = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = electricityReportQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: "Invalid query params",
                details: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const [minBill, maxBill] = await Promise.all([
            prisma.bills.findFirst({
                where: { deleted_at: null },
                orderBy: { billing_period_end: "asc" },
                select: { billing_period_end: true },
            }),
            prisma.bills.findFirst({
                where: { deleted_at: null },
                orderBy: { billing_period_end: "desc" },
                select: { billing_period_end: true },
            }),
        ]);

        if (!minBill || !maxBill) {
            res.json({
                success: true,
                data: {
                    range: { from_month: null, to_month: null },
                    summary: {
                        total_consumption: 0,
                        total_billed: 0,
                        total_paid: 0,
                        total_outstanding: 0,
                        collection_rate: 0,
                    },
                    consumption_by_month: [],
                    revenue_by_month: [],
                    building_breakdown: [],
                    subscriber_breakdown: [],
                },
            } as ApiResponse);
            return;
        }

        const fromMonth = parsed.data.from_month ?? toMonth(minBill.billing_period_end);
        const toMonthValue = parsed.data.to_month ?? toMonth(maxBill.billing_period_end);

        if (fromMonth > toMonthValue) {
            res.status(400).json({
                success: false,
                error: "from_month cannot be greater than to_month",
            });
            return;
        }

        const fromDate = parseMonthStart(fromMonth);
        const toDateExclusive = incrementMonth(parseMonthStart(toMonthValue));
        const months = listMonths(fromMonth, toMonthValue);

        const bills: DebtBillPayload[] = await prisma.bills.findMany({
            where: {
                deleted_at: null,
                billing_period_end: {
                    gte: fromDate,
                    lt: toDateExclusive,
                },
                subscriber: { deleted_at: null },
                meter: { deleted_at: null },
            },
            include: debtBillInclude,
        });

        const payments = await prisma.bill_payments.findMany({
            where: {
                deleted_at: null,
                status: { in: SETTLED_PAYMENT_STATUSES },
                bill: {
                    deleted_at: null,
                    billing_period_end: {
                        gte: fromDate,
                        lt: toDateExclusive,
                    },
                    subscriber: { deleted_at: null },
                    meter: { deleted_at: null },
                },
            },
            select: {
                bill_id: true,
                amount: true,
            },
        });

        const paidByBillId = new Map<string, number>();
        for (const payment of payments) {
            const previous = paidByBillId.get(payment.bill_id) ?? 0;
            paidByBillId.set(payment.bill_id, previous + toNumber(payment.amount));
        }

        const consumptionByMonth = new Map<string, { consumption_kwh: number; bills_count: number }>();
        const revenueByMonth = new Map<string, { billed_amount: number; collected_amount: number }>();

        const buildingBreakdown = new Map<
            string,
            {
                property_id: string;
                property_name: string;
                total_consumption: number;
                total_revenue: number;
                subscribers: Set<string>;
            }
        >();

        const subscriberBreakdown = new Map<
            string,
            {
                subscriber_id: string;
                subscriber_name: string;
                subscription_number: string;
                total_consumption: number;
                total_billed: number;
                total_paid: number;
            }
        >();

        for (const month of months) {
            consumptionByMonth.set(month, { consumption_kwh: 0, bills_count: 0 });
            revenueByMonth.set(month, { billed_amount: 0, collected_amount: 0 });
        }

        for (const bill of bills) {
            const month = toMonth(bill.billing_period_end);
            const totalAmount = toNumber(bill.total_amount);
            const consumption = toNumber(bill.consumption_kwh);
            const paid = paidByBillId.get(bill.id) ?? 0;

            const monthConsumption = consumptionByMonth.get(month) ?? {
                consumption_kwh: 0,
                bills_count: 0,
            };
            monthConsumption.consumption_kwh += consumption;
            monthConsumption.bills_count += 1;
            consumptionByMonth.set(month, monthConsumption);

            const monthRevenue = revenueByMonth.get(month) ?? {
                billed_amount: 0,
                collected_amount: 0,
            };
            monthRevenue.billed_amount += totalAmount;
            monthRevenue.collected_amount += paid;
            revenueByMonth.set(month, monthRevenue);

            const propertyId = bill.subscriber.property?.id ?? "unassigned";
            const propertyName = bill.subscriber.property?.name ?? "Unassigned";
            const currentBuilding = buildingBreakdown.get(propertyId) ?? {
                property_id: propertyId,
                property_name: propertyName,
                total_consumption: 0,
                total_revenue: 0,
                subscribers: new Set<string>(),
            };
            currentBuilding.total_consumption += consumption;
            currentBuilding.total_revenue += totalAmount;
            currentBuilding.subscribers.add(bill.subscriber_id);
            buildingBreakdown.set(propertyId, currentBuilding);

            const currentSubscriber = subscriberBreakdown.get(bill.subscriber_id) ?? {
                subscriber_id: bill.subscriber_id,
                subscriber_name: bill.subscriber.client.full_name,
                subscription_number: bill.subscriber.subscription_number,
                total_consumption: 0,
                total_billed: 0,
                total_paid: 0,
            };
            currentSubscriber.total_consumption += consumption;
            currentSubscriber.total_billed += totalAmount;
            currentSubscriber.total_paid += paid;
            subscriberBreakdown.set(bill.subscriber_id, currentSubscriber);
        }

        const consumptionItems = months.map((month) => {
            const row = consumptionByMonth.get(month) ?? { consumption_kwh: 0, bills_count: 0 };
            return {
                month,
                consumption_kwh: Number(row.consumption_kwh.toFixed(2)),
                bills_count: row.bills_count,
            };
        });

        const revenueItems = months.map((month) => {
            const row = revenueByMonth.get(month) ?? { billed_amount: 0, collected_amount: 0 };
            return {
                month,
                billed_amount: Number(row.billed_amount.toFixed(2)),
                collected_amount: Number(row.collected_amount.toFixed(2)),
            };
        });

        const buildingItems = Array.from(buildingBreakdown.values())
            .map((item) => ({
                property_id: item.property_id,
                property_name: item.property_name,
                total_subscribers: item.subscribers.size,
                total_consumption: Number(item.total_consumption.toFixed(2)),
                total_revenue: Number(item.total_revenue.toFixed(2)),
            }))
            .sort((a, b) => b.total_revenue - a.total_revenue);

        const subscriberItems = Array.from(subscriberBreakdown.values())
            .map((item) => ({
                ...item,
                total_consumption: Number(item.total_consumption.toFixed(2)),
                total_billed: Number(item.total_billed.toFixed(2)),
                total_paid: Number(item.total_paid.toFixed(2)),
                total_outstanding: Number(Math.max(0, item.total_billed - item.total_paid).toFixed(2)),
            }))
            .sort((a, b) => b.total_consumption - a.total_consumption);

        const totalConsumption = consumptionItems.reduce((sum, item) => sum + item.consumption_kwh, 0);
        const totalBilled = revenueItems.reduce((sum, item) => sum + item.billed_amount, 0);
        const totalPaid = revenueItems.reduce((sum, item) => sum + item.collected_amount, 0);
        const totalOutstanding = Math.max(0, totalBilled - totalPaid);
        const collectionRate = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;

        res.json({
            success: true,
            data: {
                range: {
                    from_month: fromMonth,
                    to_month: toMonthValue,
                },
                summary: {
                    total_consumption: Number(totalConsumption.toFixed(2)),
                    total_billed: Number(totalBilled.toFixed(2)),
                    total_paid: Number(totalPaid.toFixed(2)),
                    total_outstanding: Number(totalOutstanding.toFixed(2)),
                    collection_rate: Number(collectionRate.toFixed(2)),
                },
                consumption_by_month: consumptionItems,
                revenue_by_month: revenueItems,
                building_breakdown: buildingItems,
                subscriber_breakdown: subscriberItems,
            },
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
};
