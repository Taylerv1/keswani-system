import { payment_status } from "@prisma/client";
import { Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AuthenticatedRequest, ApiResponse } from "../types";

const OUTSTANDING_BILL_STATUSES: payment_status[] = ["pending", "partial", "overdue"];
const COLLECTED_PAYMENT_STATUSES: payment_status[] = ["paid", "partial"];

const toMonthKey = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
};

const roundTo = (value: number, digits = 2): number => {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
};

/**
 * GET /api/electricity/overview
 * Returns dashboard KPI summary, trends, and recent bills for electricity module.
 */
export const getElectricityOverview = async (
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const now = new Date();

        const [
            totalSubscribers,
            activeSubscribers,
            inactiveSubscribers,
            bills,
            outstandingBills,
            collectedAmountAgg,
            activePricing,
            latestPricing,
            recentBillRows,
        ] = await Promise.all([
            prisma.subscribers.count({
                where: { deleted_at: null },
            }),
            prisma.subscribers.count({
                where: { deleted_at: null, is_active: true },
            }),
            prisma.subscribers.count({
                where: { deleted_at: null, is_active: false },
            }),
            prisma.bills.findMany({
                where: { deleted_at: null },
                select: {
                    id: true,
                    subscriber_id: true,
                    billing_period_end: true,
                    consumption_kwh: true,
                    total_amount: true,
                    status: true,
                },
            }),
            prisma.bills.findMany({
                where: {
                    deleted_at: null,
                    status: { in: OUTSTANDING_BILL_STATUSES },
                },
                select: {
                    id: true,
                    total_amount: true,
                },
            }),
            prisma.bill_payments.aggregate({
                where: {
                    deleted_at: null,
                    status: { in: COLLECTED_PAYMENT_STATUSES },
                },
                _sum: { amount: true },
            }),
            prisma.pricing_history.findFirst({
                where: {
                    effective_from: { lte: now },
                    OR: [{ effective_to: null }, { effective_to: { gte: now } }],
                },
                orderBy: { effective_from: "desc" },
                select: { price_per_kwh: true },
            }),
            prisma.pricing_history.findFirst({
                orderBy: { effective_from: "desc" },
                select: { price_per_kwh: true },
            }),
            prisma.bills.findMany({
                where: { deleted_at: null },
                orderBy: [{ billing_period_end: "desc" }, { created_at: "desc" }],
                take: 5,
                select: {
                    id: true,
                    subscriber_id: true,
                    billing_period_end: true,
                    consumption_kwh: true,
                    total_amount: true,
                    status: true,
                    subscriber: {
                        select: {
                            client: {
                                select: { full_name: true },
                            },
                        },
                    },
                },
            }),
        ]);

        const monthlyTotals = new Map<string, { consumption: number; revenue: number }>();
        let totalConsumption = 0;

        for (const bill of bills) {
            const key = toMonthKey(bill.billing_period_end);
            const consumption = Number(bill.consumption_kwh || 0);
            const revenue = Number(bill.total_amount || 0);
            totalConsumption += consumption;

            const previous = monthlyTotals.get(key) || { consumption: 0, revenue: 0 };
            monthlyTotals.set(key, {
                consumption: previous.consumption + consumption,
                revenue: previous.revenue + revenue,
            });
        }

        const allMonths = Array.from(monthlyTotals.keys()).sort();
        const trendMonths = allMonths.slice(-6);
        const monthsForTrend = trendMonths.length > 0 ? trendMonths : [toMonthKey(now)];
        const latestMonth = monthsForTrend[monthsForTrend.length - 1];

        const latestMonthTotals = monthlyTotals.get(latestMonth) || {
            consumption: 0,
            revenue: 0,
        };

        const overdueSubscriberIds = new Set(
            bills.filter((bill) => bill.status === "overdue").map((bill) => bill.subscriber_id)
        );

        const outstandingBillIds = outstandingBills.map((bill) => bill.id);
        const outstandingPayments = outstandingBillIds.length
            ? await prisma.bill_payments.groupBy({
                by: ["bill_id"],
                where: {
                    deleted_at: null,
                    bill_id: { in: outstandingBillIds },
                    status: { in: COLLECTED_PAYMENT_STATUSES },
                },
                _sum: { amount: true },
            })
            : [];

        const paidByBill = new Map<string, number>(
            outstandingPayments.map((entry) => [entry.bill_id, Number(entry._sum.amount || 0)])
        );

        const totalDebts = outstandingBills.reduce((sum, bill) => {
            const billedAmount = Number(bill.total_amount || 0);
            const paidAmount = paidByBill.get(bill.id) || 0;
            return sum + Math.max(billedAmount - paidAmount, 0);
        }, 0);

        const currentPrice = Number(
            activePricing?.price_per_kwh ?? latestPricing?.price_per_kwh ?? 0
        );
        const hasPrice = Boolean(activePricing?.price_per_kwh ?? latestPricing?.price_per_kwh);

        res.json({
            success: true,
            data: {
                summary: {
                    total_subscribers: totalSubscribers,
                    active_subscribers: activeSubscribers,
                    inactive_subscribers: inactiveSubscribers,
                    suspended_subscribers: overdueSubscriberIds.size,
                    monthly_consumption_kwh: roundTo(latestMonthTotals.consumption),
                    monthly_total_bills: roundTo(latestMonthTotals.revenue),
                    collected_amount: Number(collectedAmountAgg._sum.amount || 0),
                    total_debts: roundTo(totalDebts),
                    current_price_per_kwh: hasPrice ? roundTo(currentPrice, 4) : null,
                    total_consumption_kwh: roundTo(totalConsumption),
                    latest_billing_month: latestMonth,
                },
                consumption_trend: monthsForTrend.map((month) => ({
                    month,
                    value: roundTo(monthlyTotals.get(month)?.consumption || 0),
                })),
                revenue_trend: monthsForTrend.map((month) => ({
                    month,
                    value: roundTo(monthlyTotals.get(month)?.revenue || 0),
                })),
                recent_bills: recentBillRows.map((bill) => ({
                    id: bill.id,
                    subscriber_id: bill.subscriber_id,
                    subscriber_name: bill.subscriber.client.full_name,
                    month: toMonthKey(bill.billing_period_end),
                    consumption: roundTo(Number(bill.consumption_kwh || 0)),
                    total_amount: roundTo(Number(bill.total_amount || 0)),
                    status: bill.status,
                })),
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};
