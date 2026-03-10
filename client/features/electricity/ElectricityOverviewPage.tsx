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

interface ElectricityOverviewSummary {
  active_subscribers: number;
  inactive_subscribers: number;
  suspended_subscribers: number;
  monthly_consumption: number;
  monthly_billed_amount: number;
  monthly_bills_count: number;
  collected_amount: number;
  total_debt: number;
  current_price_per_kwh: number | null;
  current_price_currency: string;
  total_consumption: number;
}

interface ElectricityOverviewMonthConsumption {
  month: string;
  consumption_kwh: number;
}

interface ElectricityOverviewMonthRevenue {
  month: string;
  total_amount: number;
}

interface ElectricityOverviewBill {
  id: string;
  subscriber_id: string;
  subscriber_name: string;
  month: string;
  consumption_kwh: number;
  total_amount: number;
  status: string;
  created_at: string;
}

interface ElectricityOverviewData {
  range: {
    from_month: string;
    to_month: string;
  };
  summary: ElectricityOverviewSummary;
  consumption_by_month: ElectricityOverviewMonthConsumption[];
  revenue_by_month: ElectricityOverviewMonthRevenue[];
  recent_bills: ElectricityOverviewBill[];
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

let overviewCache: ElectricityOverviewData | null = null;
let inFlightOverviewRequest: Promise<ElectricityOverviewData> | null = null;

async function fetchOverview(force = false): Promise<ElectricityOverviewData> {
  if (!force && overviewCache) {
    return overviewCache;
  }

  if (!force && inFlightOverviewRequest) {
    return inFlightOverviewRequest;
  }

  inFlightOverviewRequest = (async () => {
    const response = await fetch("/api/electricity/overview", {
      method: "GET",
      cache: "no-store",
    });

    const payload = (await response.json()) as ApiResponse<ElectricityOverviewData>;

    if (!response.ok || !payload.success || !payload.data) {
      throw new Error(payload.error || "Failed to load electricity overview");
    }

    overviewCache = payload.data;
    return payload.data;
  })();

  try {
    return await inFlightOverviewRequest;
  } finally {
    inFlightOverviewRequest = null;
  }
}

export default function ElecDashboardPage() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<ElectricityOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadOverview = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchOverview(false);
        if (!mounted) return;
        setOverview(data);
      } catch (loadError) {
        if (!mounted) return;
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load electricity overview"
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
  const collectedAmount = data.payments.reduce((s, p) => s + p.amount, 0);
  const totalDebt = data.bills.filter((b) => b.status === "unpaid" || b.status === "partial").reduce((s, b) => s + b.totalAmount, 0) -
    data.payments.filter((p) => {
      const bill = data.bills.find((b) => b.id === p.billId);
      return bill && (bill.status === "unpaid" || bill.status === "partial");
    }).reduce((s, p) => s + p.amount, 0);

    void loadOverview();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = overview?.summary ?? null;

  const consumptionByMonth = useMemo(
    () =>
      (overview?.consumption_by_month ?? []).map((item) => ({
        month: item.month.slice(5),
        value: item.consumption_kwh,
      })),
    [overview?.consumption_by_month]
  );

  const revenueByMonth = useMemo(
    () =>
      (overview?.revenue_by_month ?? []).map((item) => ({
        month: item.month.slice(5),
        value: item.total_amount,
      })),
    [overview?.revenue_by_month]
  );

  const maxConsumption = Math.max(...consumptionByMonth.map((c) => c.value), 1);
  const maxRevenue = Math.max(...revenueByMonth.map((r) => r.value), 1);

  const recentBills = overview?.recent_bills ?? [];
  const currency = summary?.current_price_currency ?? "USD";
  const currentPriceValue =
    summary?.current_price_per_kwh !== null && summary?.current_price_per_kwh !== undefined
      ? `${currency} ${summary.current_price_per_kwh}`
      : "-";

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{t("elecDashboardTitle")}</h1>
        <p className="text-text-secondary text-xs sm:text-sm mt-1">{t("welcome")}</p>
      </div>

      {loading && (
        <div className="min-h-[50vh] flex items-center justify-center">
          <LoadingLottie size={120} className="p-4" />
        </div>
      )}

      {!loading && error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-5 mb-8">
            <KpiCard
              label={t("activeSubscribers")}
              value={summary.active_subscribers}
              icon={<Users size={22} />}
              color="text-card-green"
              bgColor="bg-card-green-light"
              trend={`${summary.suspended_subscribers} ${t("suspendedSubscribers")}`}
            />
            <KpiCard
              label={t("monthlyConsumption")}
              value={`${summary.monthly_consumption.toLocaleString()} ${t("kwh")}`}
              icon={<Zap size={22} />}
              color="text-card-orange"
              bgColor="bg-card-orange-light"
            />
            <KpiCard
              label={t("totalBills")}
              value={`${currency} ${summary.monthly_billed_amount.toFixed(2)}`}
              icon={<Receipt size={22} />}
              color="text-card-blue"
              bgColor="bg-card-blue-light"
              trend={`${summary.monthly_bills_count} ${t("recentBills")}`}
            />
            <KpiCard
              label={t("collectedAmount")}
              value={`${currency} ${summary.collected_amount.toFixed(2)}`}
              icon={<DollarSign size={22} />}
              color="text-card-green"
              bgColor="bg-card-green-light"
            />
            <KpiCard
              label={t("totalDebts")}
              value={`${currency} ${summary.total_debt.toFixed(2)}`}
              icon={<AlertTriangle size={22} />}
              color="text-card-red"
              bgColor="bg-card-red-light"
            />
            <KpiCard
              label={t("currentPriceKwh")}
              value={currentPriceValue}
              icon={<Gauge size={22} />}
              color="text-card-orange"
              bgColor="bg-card-orange-light"
              trend={t("perKwh")}
            />
            <KpiCard
              label={t("inactiveSubscribers")}
              value={summary.inactive_subscribers}
              icon={<UserX size={22} />}
              color="text-card-red"
              bgColor="bg-card-red-light"
            />
            <KpiCard
              label={t("totalConsumption")}
              value={`${summary.total_consumption.toLocaleString()} ${t("kwh")}`}
              icon={<TrendingUp size={22} />}
              color="text-card-blue"
              bgColor="bg-card-blue-light"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <div className="bg-surface rounded-xl border border-surface-border p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">{t("consumptionTrend")}</h2>
              <div className="flex items-end gap-1.5 sm:gap-3 h-32 sm:h-40">
                {consumptionByMonth.map((item) => (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-text-muted font-medium">
                      {item.value > 0 ? item.value.toFixed(0) : ""}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-card-orange to-primary transition-all duration-300"
                      style={{
                        height: `${item.value > 0 ? (item.value / maxConsumption) * 100 : 2}%`,
                        minHeight: 4,
                      }}
                    />
                    <span className="text-xs text-text-secondary font-medium">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-surface-border p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">{t("revenueTrend")}</h2>
              <div className="flex items-end gap-1.5 sm:gap-3 h-32 sm:h-40">
                {revenueByMonth.map((item) => (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-text-muted font-medium">
                      {item.value > 0 ? `${currency} ${item.value.toFixed(0)}` : ""}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-card-blue to-card-green transition-all duration-300"
                      style={{
                        height: `${item.value > 0 ? (item.value / maxRevenue) * 100 : 2}%`,
                        minHeight: 4,
                      }}
                    />
                    <span className="text-xs text-text-secondary font-medium">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-border">
              <h2 className="text-sm font-semibold text-text-primary">{t("recentBills")}</h2>
            </div>
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
                    <tr
                      key={bill.id}
                      className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-text-primary">{bill.subscriber_name}</td>
                      <td className="px-4 py-3 text-text-secondary">{bill.month}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {bill.consumption_kwh.toLocaleString()} {t("kwh")}
                      </td>
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {currency} {bill.total_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={bill.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-surface-border">
              {recentBills.map((bill) => (
                <div key={bill.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary text-sm">{bill.subscriber_name}</span>
                    <StatusBadge status={bill.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">{bill.month}</span>
                    <span className="text-text-secondary">
                      {bill.consumption_kwh.toLocaleString()} {t("kwh")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">{t("totalAmountBill")}</span>
                    <span className="text-sm font-semibold text-text-primary">
                      {currency} {bill.total_amount.toFixed(2)}
                    </span>
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
