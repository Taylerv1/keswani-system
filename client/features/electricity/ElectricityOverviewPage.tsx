"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useTranslation } from "@/lib/translation";
import { KpiCard, LoadingLottie, StatusBadge } from "@/components/ui";

type ElectricityOverviewData = {
  summary: {
    total_subscribers: number;
    active_subscribers: number;
    inactive_subscribers: number;
    suspended_subscribers: number;
    monthly_consumption_kwh: number;
    monthly_total_bills: number;
    collected_amount: number;
    total_debts: number;
    current_price_per_kwh: number | null;
    total_consumption_kwh: number;
    latest_billing_month: string;
  };
  consumption_trend: Array<{
    month: string;
    value: number;
  }>;
  revenue_trend: Array<{
    month: string;
    value: number;
  }>;
  recent_bills: Array<{
    id: string;
    subscriber_id: string;
    subscriber_name: string;
    month: string;
    consumption: number;
    total_amount: number;
    status: string;
  }>;
};

export default function ElecDashboardPage() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<ElectricityOverviewData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadOverview = async () => {
      setLoadingOverview(true);
      setOverviewError(null);
      try {
        const res = await fetch("/api/electricity/overview", {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await res.json().catch(() => null)) as {
          success?: boolean;
          data?: ElectricityOverviewData;
          error?: string;
        } | null;

        if (!mounted) return;

        if (!res.ok || !payload?.success || !payload?.data) {
          setOverview(null);
          setOverviewError(payload?.error || "Failed to load electricity overview.");
          return;
        }

        setOverview(payload.data);
      } catch {
        if (!mounted) return;
        setOverview(null);
        setOverviewError("Failed to load electricity overview.");
      } finally {
        if (mounted) setLoadingOverview(false);
      }
    };

    loadOverview();
    return () => {
      mounted = false;
    };
  }, []);

  const summary = overview?.summary;
  const consumptionByMonth = overview?.consumption_trend || [];
  const revenueByMonth = overview?.revenue_trend || [];
  const recentBills = overview?.recent_bills || [];

  const maxConsumption = useMemo(
    () => consumptionByMonth.reduce((max, item) => Math.max(max, item.value), 1),
    [consumptionByMonth]
  );
  const maxRevenue = useMemo(
    () => revenueByMonth.reduce((max, item) => Math.max(max, item.value), 1),
    [revenueByMonth]
  );

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{t("elecDashboardTitle")}</h1>
        <p className="text-text-secondary text-xs sm:text-sm mt-1">{t("welcome")}</p>
      </div>

      {loadingOverview && (
        <div className="min-h-[55vh] flex items-center justify-center">
          <LoadingLottie size={120} className="p-4" />
        </div>
      )}

      {!loadingOverview && overviewError && (
        <p className="text-xs sm:text-sm text-card-red mb-3">{overviewError}</p>
      )}

      {!loadingOverview && overview && (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-5 mb-8">
            <KpiCard
              label={t("activeSubscribers")}
              value={summary?.active_subscribers ?? "—"}
              icon={<Users size={22} />}
              color="text-card-green"
              bgColor="bg-card-green-light"
              trend={`${summary?.suspended_subscribers ?? 0} ${t("suspendedSubscribers")}`}
            />
            <KpiCard
              label={t("monthlyConsumption")}
              value={`${(summary?.monthly_consumption_kwh ?? 0).toLocaleString()} ${t("kwh")}`}
              icon={<Zap size={22} />}
              color="text-card-orange"
              bgColor="bg-card-orange-light"
            />
            <KpiCard
              label={t("totalBills")}
              value={`$${(summary?.monthly_total_bills ?? 0).toFixed(2)}`}
              icon={<Receipt size={22} />}
              color="text-card-blue"
              bgColor="bg-card-blue-light"
              trend={`${recentBills.length} ${t("recentBills")}`}
            />
            <KpiCard
              label={t("collectedAmount")}
              value={`$${(summary?.collected_amount ?? 0).toFixed(2)}`}
              icon={<DollarSign size={22} />}
              color="text-card-green"
              bgColor="bg-card-green-light"
            />
            <KpiCard
              label={t("totalDebts")}
              value={`$${(summary?.total_debts ?? 0).toFixed(2)}`}
              icon={<AlertTriangle size={22} />}
              color="text-card-red"
              bgColor="bg-card-red-light"
            />
            <KpiCard
              label={t("currentPriceKwh")}
              value={
                summary?.current_price_per_kwh !== null &&
                summary?.current_price_per_kwh !== undefined
                  ? `$${summary.current_price_per_kwh}`
                  : "—"
              }
              icon={<Gauge size={22} />}
              color="text-card-orange"
              bgColor="bg-card-orange-light"
              trend={t("perKwh")}
            />
            <KpiCard
              label={t("inactiveSubscribers")}
              value={summary?.inactive_subscribers ?? "—"}
              icon={<UserX size={22} />}
              color="text-card-red"
              bgColor="bg-card-red-light"
            />
            <KpiCard
              label={t("totalConsumption")}
              value={`${(summary?.total_consumption_kwh ?? 0).toLocaleString()} ${t("kwh")}`}
              icon={<TrendingUp size={22} />}
              color="text-card-blue"
              bgColor="bg-card-blue-light"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
            {/* Consumption Chart */}
            <div className="bg-surface rounded-xl border border-surface-border p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">{t("consumptionTrend")}</h2>
              <div className="flex items-end gap-1.5 sm:gap-3 h-32 sm:h-40">
                {consumptionByMonth.map((item) => (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-text-muted font-medium">{item.value || ""}</span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-card-orange to-primary transition-all duration-300"
                      style={{ height: `${item.value > 0 ? (item.value / maxConsumption) * 100 : 2}%`, minHeight: 4 }}
                    />
                    <span className="text-xs text-text-secondary font-medium">{item.month.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-surface rounded-xl border border-surface-border p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">{t("revenueTrend")}</h2>
              <div className="flex items-end gap-1.5 sm:gap-3 h-32 sm:h-40">
                {revenueByMonth.map((item) => (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-text-muted font-medium">{item.value > 0 ? `$${item.value.toFixed(0)}` : ""}</span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-card-blue to-card-green transition-all duration-300"
                      style={{ height: `${item.value > 0 ? (item.value / maxRevenue) * 100 : 2}%`, minHeight: 4 }}
                    />
                    <span className="text-xs text-text-secondary font-medium">{item.month.slice(5)}</span>
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
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
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
                  {recentBills.map((bill) => (
                    <tr key={bill.id} className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-text-primary">{bill.subscriber_name}</td>
                      <td className="px-4 py-3 text-text-secondary">{bill.month}</td>
                      <td className="px-4 py-3 text-text-secondary">{bill.consumption} {t("kwh")}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">${bill.total_amount.toFixed(2)}</td>
                      <td className="px-4 py-3"><StatusBadge status={bill.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-surface-border">
              {recentBills.map((bill) => (
                <div key={bill.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary text-sm">{bill.subscriber_name}</span>
                    <StatusBadge status={bill.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">{bill.month}</span>
                    <span className="text-text-secondary">{bill.consumption} {t("kwh")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">{t("totalAmountBill")}</span>
                    <span className="text-sm font-semibold text-text-primary">${bill.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
