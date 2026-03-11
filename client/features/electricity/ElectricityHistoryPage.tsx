"use client";

import { useMemo } from "react";
import { useTranslation } from "@/lib/translation";
import { useCustomer } from "@/features/profile/context/customer-context";
import { KpiCard, LoadingLottie, StatusBadge } from "@/components/ui";
import ElectricityBillCard from "@/features/electricity/components/ElectricityBillCard";
import {
    Zap,
    Gauge,
    Receipt,
    CreditCard,
    AlertTriangle,
    TrendingUp,
} from "lucide-react";

function ConsumptionLineChart({
    data,
    locale,
}: {
    data: Array<{ month: string; value: number }>;
    locale: string;
}) {
    if (!data.length) {
        return <div className="text-sm text-text-muted">No data</div>;
    }

    // 3-char abbreviations — same visual width in both languages
    const monthAbbr = {
        ar: ["ينا","فبر","مار","أبر","ماي","يون","يول","أغس","سبت","أكت","نوف","ديس"],
        en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    };

    function formatMonth(monthStr: string): string {
        const num = parseInt(monthStr, 10);
        if (isNaN(num) || num < 1 || num > 12) return monthStr;
        return locale === "ar" ? monthAbbr.ar[num - 1] : monthAbbr.en[num - 1];
    }

    const minPointSpacing = 80;
    const width = Math.max(500, data.length * minPointSpacing);
    const height = 230;
    const paddingLeft = 56;
    const paddingRight = 24;
    const paddingTop = 36;
    const paddingBottom = 54;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;
    const maxValue = Math.max(...data.map((item) => item.value), 1);

    const points = data.map((item, index) => {
        const x =
            data.length === 1
                ? paddingLeft + plotWidth / 2
                : paddingLeft + (index * plotWidth) / (data.length - 1);
        const y = paddingTop + (1 - item.value / maxValue) * plotHeight;
        return { x, y, label: item.month, value: item.value };
    });

    const linePath = points
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
        .join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${
        paddingTop + plotHeight
    } Z`;

    return (
        <div className="overflow-x-auto">
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="Consumption trend chart"
            >
                <defs>
                    <linearGradient id="historyConsumptionArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
                    </linearGradient>
                </defs>

                {[0, 1, 2, 3, 4].map((step) => {
                    const y = paddingTop + (step * plotHeight) / 4;
                    const value = Math.round(((4 - step) * maxValue) / 4);
                    return (
                        <g key={`consumption-grid-${step}`}>
                            <line
                                x1={paddingLeft}
                                y1={y}
                                x2={width - paddingRight}
                                y2={y}
                                stroke="#e5e7eb"
                                strokeDasharray="4 4"
                            />
                            <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#6b7280">
                                {value}
                            </text>
                        </g>
                    );
                })}

                <path d={areaPath} fill="url(#historyConsumptionArea)" />
                <path d={linePath} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />

                {points.map((point) => {
                    // If point is near the top, place value label below to avoid overlap with Y-axis label
                    const labelY = point.y < paddingTop + 20 ? point.y + 20 : point.y - 12;
                    return (
                        <g key={point.label}>
                            <circle cx={point.x} cy={point.y} r="4.5" fill="#f97316" />
                            <text x={point.x} y={labelY} textAnchor="middle" fontSize="10" fill="#374151">
                                {point.value.toFixed(0)}
                            </text>
                            <text x={point.x} y={height - 18} textAnchor="middle" fontSize="10" fill="#6b7280">
                                {formatMonth(point.label)}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

function BillingComparisonChart({
    data,
}: {
    data: Array<{ month: string; billed: number; paid: number }>;
}) {
    if (!data.length) {
        return <div className="text-sm text-text-muted">No data</div>;
    }

    const width = Math.max(680, data.length * 96);
    const height = 320;
    const paddingLeft = 56;
    const paddingRight = 24;
    const paddingTop = 24;
    const paddingBottom = 64;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;
    const maxValue = Math.max(...data.map((item) => Math.max(item.billed, item.paid)), 1);

    return (
        <div className="overflow-x-auto">
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="Billing comparison chart"
            >
                {[0, 1, 2, 3, 4].map((step) => {
                    const y = paddingTop + (step * plotHeight) / 4;
                    const value = ((4 - step) * maxValue) / 4;
                    return (
                        <g key={`revenue-grid-${step}`}>
                            <line
                                x1={paddingLeft}
                                y1={y}
                                x2={width - paddingRight}
                                y2={y}
                                stroke="#e5e7eb"
                                strokeDasharray="4 4"
                            />
                            <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#6b7280">
                                {value.toFixed(0)}
                            </text>
                        </g>
                    );
                })}

                {data.map((item, index) => {
                    const groupWidth = plotWidth / data.length;
                    const xStart = paddingLeft + index * groupWidth + groupWidth * 0.18;
                    const barWidth = Math.max(12, groupWidth * 0.26);
                    const billedHeight = (item.billed / maxValue) * plotHeight;
                    const paidHeight = (item.paid / maxValue) * plotHeight;
                    const billedY = paddingTop + plotHeight - billedHeight;
                    const paidY = paddingTop + plotHeight - paidHeight;

                    return (
                        <g key={`revenue-group-${item.month}`}>
                            <rect x={xStart} y={billedY} width={barWidth} height={billedHeight} rx="4" fill="#3b82f6" />
                            <rect
                                x={xStart + barWidth + groupWidth * 0.12}
                                y={paidY}
                                width={barWidth}
                                height={paidHeight}
                                rx="4"
                                fill="#10b981"
                            />
                            <text x={xStart + barWidth} y={height - 24} textAnchor="middle" fontSize="10" fill="#6b7280">
                                {item.month}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

export default function ElectricityHistoryPage() {
    const { t, locale } = useTranslation();
    const { data, loading, error } = useCustomer();
    const electricity = data.electricity;
    const readings = useMemo(() => electricity?.readings ?? [], [electricity]);
    const bills = useMemo(() => electricity?.bills ?? [], [electricity]);
    const payments = useMemo(() => electricity?.payments ?? [], [electricity]);
    const currentPricePerKwh = electricity?.currentPricePerKwh ?? 0;
    const meterId = electricity?.meterId ?? "";
    const meterType = electricity?.meterType ?? "";

    const totalOutstanding = bills
        .filter((b) => b.status === "unpaid" || b.status === "partial")
        .reduce((s, b) => s + b.totalAmount, 0);

    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

    const latestConsumption = readings.length > 0 ? readings[0].consumption : 0;

    const consumptionData = useMemo(
        () => [...readings].reverse().map((r) => ({ month: r.month.slice(5), value: r.consumption })),
        [readings]
    );

    const revenueData = useMemo(() => {
        const billedByMonth = new Map<string, number>();
        const paidByMonth = new Map<string, number>();
        const billById = new Map(bills.map((bill) => [bill.id, bill]));

        for (const bill of bills) {
            billedByMonth.set(bill.month, (billedByMonth.get(bill.month) ?? 0) + bill.totalAmount);
        }

        for (const payment of payments) {
            const bill = billById.get(payment.billId);
            const month = bill?.month ?? payment.date.slice(0, 7);
            paidByMonth.set(month, (paidByMonth.get(month) ?? 0) + payment.amount);
        }

        const months = Array.from(new Set([...billedByMonth.keys(), ...paidByMonth.keys()])).sort();
        return months.map((month) => ({
            month: month.slice(5),
            billed: billedByMonth.get(month) ?? 0,
            paid: paidByMonth.get(month) ?? 0,
        }));
    }, [bills, payments]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <LoadingLottie size={140} className="p-6" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
            </div>
        );
    }

    if (!electricity) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-text-secondary">{t("noData")}</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                    {t("custElecHistory")}
                </h1>
                <p className="text-text-secondary text-xs sm:text-sm mt-1">
                    {t("custElecHistorySubtitle")}
                </p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
                <KpiCard
                    label={t("currentPriceKwh")}
                    value={`$${currentPricePerKwh}`}
                    icon={<Zap size={22} />}
                    color="text-card-orange"
                    bgColor="bg-card-orange-light"
                    trend={t("perKwh")}
                />
                <KpiCard
                    label={t("custLatestConsumption")}
                    value={`${latestConsumption} ${t("kwh")}`}
                    icon={<Gauge size={22} />}
                    color="text-card-blue"
                    bgColor="bg-card-blue-light"
                />
                <KpiCard
                    label={t("totalOutstanding")}
                    value={`$${totalOutstanding.toFixed(2)}`}
                    icon={<AlertTriangle size={22} />}
                    color={totalOutstanding > 0 ? "text-card-red" : "text-card-green"}
                    bgColor={totalOutstanding > 0 ? "bg-card-red-light" : "bg-card-green-light"}
                />
                <KpiCard
                    label={t("totalPaid")}
                    value={`$${totalPaid.toFixed(2)}`}
                    icon={<CreditCard size={22} />}
                    color="text-card-green"
                    bgColor="bg-card-green-light"
                />
            </div>

            {/* Meter Info + Consumption Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Meter Info */}
                <div className="bg-surface rounded-xl border border-surface-border p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <Gauge size={18} className="text-primary" />
                        <h2 className="text-sm font-semibold text-text-primary">
                            {t("custMeterInfo")}
                        </h2>
                    </div>
                    <div className="space-y-2.5 sm:space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-text-muted">{t("meterNumber")}</span>
                            <span className="text-xs sm:text-sm font-medium text-text-primary font-mono truncate ml-2">
                                {meterId}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-text-muted">{t("meterType")}</span>
                            <StatusBadge status={meterType} />
                        </div>
                        {readings[0] && (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-text-muted">{t("previousReading")}</span>
                                    <span className="text-xs sm:text-sm text-text-secondary">
                                        {readings[0].previousReading}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Consumption Chart */}
                <div className="bg-surface rounded-xl border border-surface-border p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <TrendingUp size={18} className="text-primary" />
                        <h2 className="text-sm font-semibold text-text-primary">
                            {t("consumptionTrend")}
                        </h2>
                    </div>
                    <ConsumptionLineChart data={consumptionData} locale={locale} />
                </div>
            </div>

            {/* Bills */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Receipt size={18} className="text-primary" />
                    <h2 className="text-base sm:text-lg font-semibold text-text-primary">
                        {t("custBillsList")}
                    </h2>
                    <span className="text-xs text-text-muted ml-auto">{bills.length} {t("bills")}</span>
                </div>
                {bills.length === 0 ? (
                    <div className="bg-surface rounded-xl border border-surface-border p-8 text-center">
                        <Receipt size={32} className="text-text-muted mx-auto mb-2" />
                        <p className="text-sm text-text-muted">{t("noData")}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {bills.map((bill) => (
                            <ElectricityBillCard key={bill.id} bill={bill} />
                        ))}
                    </div>
                )}
            </div>

            {/* Payment History */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <CreditCard size={18} className="text-primary" />
                    <h2 className="text-base sm:text-lg font-semibold text-text-primary">
                        {t("paymentHistory")}
                    </h2>
                    <span className="text-xs text-text-muted ml-auto">{payments.length} {t("records")}</span>
                </div>
                <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-surface-border bg-background">
                                    <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                                        {t("bill")}
                                    </th>
                                    <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                                        {t("amount")}
                                    </th>
                                    <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                                        {t("date")}
                                    </th>
                                    <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                                        {t("collectedBy")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 font-medium text-text-primary font-mono">
                                            {p.billId}
                                        </td>
                                        <td className="px-4 py-3 text-text-primary">
                                            ${p.amount.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary">{p.date}</td>
                                        <td className="px-4 py-3 text-text-secondary">
                                            {p.collectedBy}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-surface-border">
                        {payments.length === 0 ? (
                            <div className="p-6 text-center">
                                <CreditCard size={28} className="text-text-muted mx-auto mb-2" />
                                <p className="text-sm text-text-muted">{t("noData")}</p>
                            </div>
                        ) : (
                            payments.map((p) => (
                                <div key={p.id} className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-card-green text-sm">${p.amount.toFixed(2)}</span>
                                        <span className="text-xs text-text-muted bg-background px-2 py-0.5 rounded-full">{p.date}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-text-muted font-mono truncate mr-2">{p.billId}</span>
                                        <span className="text-text-secondary whitespace-nowrap">{p.collectedBy}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Readings History */}
            <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Gauge size={18} className="text-primary" />
                    <h2 className="text-base sm:text-lg font-semibold text-text-primary">
                        {t("custReadingsHistory")}
                    </h2>
                    <span className="text-xs text-text-muted ml-auto">{readings.length} {t("records")}</span>
                </div>
                <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-surface-border bg-background">
                                    <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                                        {t("month")}
                                    </th>
                                    <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                                        {t("previousReading")}
                                    </th>
                                    <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                                        {t("consumption")}
                                    </th>
                                    <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                                        {t("readingDate")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {readings.map((r) => (
                                    <tr
                                        key={r.id}
                                        className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 font-medium text-text-primary">
                                            {r.month}
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary">
                                            {r.previousReading}
                                        </td>
                                        <td className="px-4 py-3 text-text-primary font-medium">
                                            {r.consumption} {t("kwh")}
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary">
                                            {r.readingDate}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-surface-border">
                        {readings.length === 0 ? (
                            <div className="p-6 text-center">
                                <Gauge size={28} className="text-text-muted mx-auto mb-2" />
                                <p className="text-sm text-text-muted">{t("noData")}</p>
                            </div>
                        ) : (
                            readings.map((r) => (
                                <div key={r.id} className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-text-primary text-sm">{r.month}</span>
                                        <span className="font-semibold text-card-orange text-sm">{r.consumption} {t("kwh")}</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 text-xs">
                                        <div className="bg-background rounded-lg px-2 py-1.5">
                                            <span className="text-text-muted block text-[10px]">{t("previousReading")}</span>
                                            <span className="text-text-secondary font-medium">{r.previousReading}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-text-muted">{r.readingDate}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
