"use client";

import { useMemo } from "react";
import { useTranslation } from "@/lib/translation-context";
import { useCustomer } from "@/modules/customer/customer-context";
import { StatusBadge, KpiCard } from "@/components/ui";
import ElectricityBillCard from "@/components/customer/ElectricityBillCard";
import {
    Zap,
    Gauge,
    Receipt,
    CreditCard,
    AlertTriangle,
    TrendingUp,
} from "lucide-react";

export default function ElectricityHistoryPage() {
    const { t } = useTranslation();
    const { data } = useCustomer();

    if (!data.electricity) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-text-secondary">{t("noData")}</p>
            </div>
        );
    }

    const { readings, bills, payments, currentPricePerKwh, meterId, meterType } =
        data.electricity;

    const totalOutstanding = bills
        .filter((b) => b.status === "unpaid" || b.status === "partial")
        .reduce((s, b) => s + b.totalAmount, 0);

    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

    const latestConsumption = readings.length > 0 ? readings[0].consumption : 0;

    // Consumption trend mini-chart data
    const consumptionData = useMemo(
        () => [...readings].reverse().map((r) => ({ month: r.month.slice(5), value: r.consumption })),
        [readings]
    );
    const maxConsumption = Math.max(...consumptionData.map((c) => c.value), 1);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-primary">
                    {t("custElecHistory")}
                </h1>
                <p className="text-text-secondary text-sm mt-1">
                    {t("custElecHistorySubtitle")}
                </p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Meter Info */}
                <div className="bg-surface rounded-xl border border-surface-border p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Gauge size={18} className="text-primary" />
                        <h2 className="text-sm font-semibold text-text-primary">
                            {t("custMeterInfo")}
                        </h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-text-muted">{t("meterNumber")}</span>
                            <span className="text-sm font-medium text-text-primary font-mono">
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
                                    <span className="text-sm text-text-secondary">
                                        {readings[0].previousReading}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-text-muted">{t("currentReading")}</span>
                                    <span className="text-sm font-medium text-text-primary">
                                        {readings[0].currentReading}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Consumption Chart */}
                <div className="bg-surface rounded-xl border border-surface-border p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={18} className="text-primary" />
                        <h2 className="text-sm font-semibold text-text-primary">
                            {t("consumptionTrend")}
                        </h2>
                    </div>
                    <div className="flex items-end gap-3 h-40">
                        {consumptionData.map((item) => (
                            <div
                                key={item.month}
                                className="flex-1 flex flex-col items-center gap-1"
                            >
                                <span className="text-xs text-text-muted font-medium">
                                    {item.value}
                                </span>
                                <div
                                    className="w-full rounded-t-md bg-gradient-to-t from-card-orange to-primary transition-all duration-300"
                                    style={{
                                        height: `${(item.value / maxConsumption) * 100}%`,
                                        minHeight: 4,
                                    }}
                                />
                                <span className="text-xs text-text-secondary font-medium">
                                    {item.month}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bills */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Receipt size={18} className="text-primary" />
                    <h2 className="text-lg font-semibold text-text-primary">
                        {t("custBillsList")}
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bills.map((bill) => (
                        <ElectricityBillCard key={bill.id} bill={bill} />
                    ))}
                </div>
            </div>

            {/* Payment History */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <CreditCard size={18} className="text-primary" />
                    <h2 className="text-lg font-semibold text-text-primary">
                        {t("paymentHistory")}
                    </h2>
                </div>
                <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
                    <div className="overflow-x-auto">
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
                                        {t("paymentMethod")}
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
                                            {t(p.method === "bank_transfer" ? "bankTransfer" : p.method)}
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary">
                                            {p.collectedBy}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Readings History */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Gauge size={18} className="text-primary" />
                    <h2 className="text-lg font-semibold text-text-primary">
                        {t("custReadingsHistory")}
                    </h2>
                </div>
                <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
                    <div className="overflow-x-auto">
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
                                        {t("currentReading")}
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
                                            {r.currentReading}
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
                </div>
            </div>
        </div>
    );
}
