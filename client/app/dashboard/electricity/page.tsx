"use client";

import { useMemo } from "react";
import {
  Users,
  UserX,
  Zap,
  Receipt,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Gauge,
} from "lucide-react";
import { useTranslation } from "@/lib/translation-context";
import { useElectricity } from "@/modules/electricity/electricity-context";
import { KpiCard, StatusBadge } from "@/components/ui";

const MONTHS = [
  "2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01",
];

export default function ElecDashboardPage() {
  const { t, locale } = useTranslation();
  const { data } = useElectricity();

  const activeSubs = data.subscribers.filter((s) => s.status === "active").length;
  const inactiveSubs = data.subscribers.filter((s) => s.status === "inactive").length;
  const suspendedSubs = data.subscribers.filter((s) => s.status === "suspended").length;

  const currentMonthBills = data.bills.filter((b) => b.month === "2026-01");
  const monthlyConsumption = currentMonthBills.reduce((s, b) => s + b.consumption, 0);
  const totalBillsAmount = currentMonthBills.reduce((s, b) => s + b.totalAmount, 0);

  const collectedAmount = data.payments.reduce((s, p) => s + p.amount, 0);
  const totalDebt = data.bills.filter((b) => b.status === "unpaid" || b.status === "partial").reduce((s, b) => s + b.totalAmount, 0) -
    data.payments.filter((p) => {
      const bill = data.bills.find((b) => b.id === p.billId);
      return bill && (bill.status === "unpaid" || bill.status === "partial");
    }).reduce((s, p) => s + p.amount, 0);

  const currentPrice = data.pricing.find((p) => !p.effectiveTo || new Date(p.effectiveTo) >= new Date());

  // Chart data: consumption per month
  const consumptionByMonth = useMemo(() => {
    return MONTHS.map((m) => {
      const total = data.readings.filter((r) => r.month === m).reduce((s, r) => s + r.consumption, 0);
      return { month: m.slice(5), value: total };
    });
  }, [data.readings]);

  const maxConsumption = Math.max(...consumptionByMonth.map((c) => c.value), 1);

  // Revenue by month
  const revenueByMonth = useMemo(() => {
    return MONTHS.map((m) => {
      const total = data.bills.filter((b) => b.month === m).reduce((s, b) => s + b.totalAmount, 0);
      return { month: m.slice(5), value: total };
    });
  }, [data.bills]);

  const maxRevenue = Math.max(...revenueByMonth.map((r) => r.value), 1);

  const getSubscriberName = (id: string) => {
    const sub = data.subscribers.find((s) => s.id === id);
    return sub ? (locale === "ar" ? sub.nameAr : sub.name) : id;
  };

  const recentBills = [...data.bills].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t("elecDashboardTitle")}</h1>
        <p className="text-text-secondary text-sm mt-1">{t("welcome")}</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KpiCard label={t("activeSubscribers")} value={activeSubs} icon={<Users size={22} />} color="text-card-green" bgColor="bg-card-green-light" trend={`${suspendedSubs} ${t("suspendedSubscribers")}`} />
        <KpiCard label={t("monthlyConsumption")} value={`${monthlyConsumption.toLocaleString()} ${t("kwh")}`} icon={<Zap size={22} />} color="text-card-orange" bgColor="bg-card-orange-light" />
        <KpiCard label={t("totalBills")} value={`$${totalBillsAmount.toFixed(2)}`} icon={<Receipt size={22} />} color="text-card-blue" bgColor="bg-card-blue-light" trend={`${currentMonthBills.length} ${t("recentBills")}`} />
        <KpiCard label={t("collectedAmount")} value={`$${collectedAmount.toFixed(2)}`} icon={<DollarSign size={22} />} color="text-card-green" bgColor="bg-card-green-light" />
        <KpiCard label={t("totalDebts")} value={`$${totalDebt.toFixed(2)}`} icon={<AlertTriangle size={22} />} color="text-card-red" bgColor="bg-card-red-light" />
        <KpiCard label={t("currentPriceKwh")} value={currentPrice ? `$${currentPrice.pricePerKwh}` : "–"} icon={<Gauge size={22} />} color="text-card-orange" bgColor="bg-card-orange-light" trend={t("perKwh")} />
        <KpiCard label={t("inactiveSubscribers")} value={inactiveSubs} icon={<UserX size={22} />} color="text-card-red" bgColor="bg-card-red-light" />
        <KpiCard label={t("totalConsumption")} value={`${data.readings.reduce((s, r) => s + r.consumption, 0).toLocaleString()} ${t("kwh")}`} icon={<TrendingUp size={22} />} color="text-card-blue" bgColor="bg-card-blue-light" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Consumption Chart */}
        <div className="bg-surface rounded-xl border border-surface-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">{t("consumptionTrend")}</h2>
          <div className="flex items-end gap-3 h-40">
            {consumptionByMonth.map((item) => (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-text-muted font-medium">{item.value || ""}</span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-card-orange to-primary transition-all duration-300"
                  style={{ height: `${item.value > 0 ? (item.value / maxConsumption) * 100 : 2}%`, minHeight: 4 }}
                />
                <span className="text-xs text-text-secondary font-medium">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-surface rounded-xl border border-surface-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">{t("revenueTrend")}</h2>
          <div className="flex items-end gap-3 h-40">
            {revenueByMonth.map((item) => (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-text-muted font-medium">{item.value > 0 ? `$${item.value.toFixed(0)}` : ""}</span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-card-blue to-card-green transition-all duration-300"
                  style={{ height: `${item.value > 0 ? (item.value / maxRevenue) * 100 : 2}%`, minHeight: 4 }}
                />
                <span className="text-xs text-text-secondary font-medium">{item.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bills */}
      <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border">
          <h2 className="text-sm font-semibold text-text-primary">{t("recentBills")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-background">
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriber")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("billMonth")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("consumption")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("totalAmountBill")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {recentBills.map((b) => (
                <tr key={b.id} className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">{getSubscriberName(b.subscriberId)}</td>
                  <td className="px-4 py-3 text-text-secondary">{b.month}</td>
                  <td className="px-4 py-3 text-text-secondary">{b.consumption} {t("kwh")}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">${b.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
