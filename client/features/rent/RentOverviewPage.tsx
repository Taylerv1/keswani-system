"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  CreditCard,
  AlertTriangle,
  FileText,
  Wrench,
  TrendingUp,
  Home,
} from "lucide-react";
import { KpiCard, LoadingLottie } from "@/components/ui";
import { useTranslation } from "@/lib/translation";
import { useRent } from "@/features/rent/context/rent-context";

type RentOverview = {
  total_properties: number;
  total_units: number;
  rented_units: number;
  vacant_units: number;
  total_tenants: number;
  monthly_income: number;
  late_payments: number;
  contracts_ending_soon: number;
  maintenance_notifications: number;
  occupancy_rate: number;
};

export default function RentOverviewPage() {
  const { t, locale } = useTranslation();
  const { data } = useRent();

  const [overview, setOverview] = useState<RentOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadOverview = async () => {
      setLoadingOverview(true);
      setOverviewError(null);
      try {
        const res = await fetch("/api/rent/overview", {
          method: "GET",
          cache: "no-store",
        });
        const payload = await res.json();
        if (!mounted) return;

        if (!res.ok || !payload?.success || !payload?.data) {
          setOverview(null);
          setOverviewError(payload?.error || "Failed to load rent overview.");
          return;
        }

        setOverview(payload.data as RentOverview);
      } catch {
        if (!mounted) return;
        setOverview(null);
        setOverviewError("Failed to load rent overview.");
      } finally {
        if (mounted) setLoadingOverview(false);
      }
    };

    loadOverview();
    return () => {
      mounted = false;
    };
  }, []);

  const kpis = [
    {
      label: t("totalProperties"),
      value: overview ? overview.total_properties : "—",
      icon: <Building2 size={22} />,
      color: "text-card-blue",
      bgColor: "bg-card-blue-light",
    },
    {
      label: t("rentedUnits"),
      value: overview ? `${overview.rented_units} / ${overview.total_units}` : "—",
      icon: <Home size={22} />,
      color: "text-card-green",
      bgColor: "bg-card-green-light",
      trend: overview ? `${overview.occupancy_rate}% ${t("occupancyRate")}` : undefined,
    },
    {
      label: t("vacantUnits"),
      value: overview ? overview.vacant_units : "—",
      icon: <Building2 size={22} />,
      color: "text-card-orange",
      bgColor: "bg-card-orange-light",
    },
    {
      label: t("totalTenants"),
      value: overview ? overview.total_tenants : "—",
      icon: <Users size={22} />,
      color: "text-card-blue",
      bgColor: "bg-card-blue-light",
    },
    {
      label: t("monthlyIncome"),
      value: overview ? `$${overview.monthly_income.toLocaleString()}` : "—",
      icon: <TrendingUp size={22} />,
      color: "text-card-green",
      bgColor: "bg-card-green-light",
    },
    {
      label: t("latePayments"),
      value: overview ? overview.late_payments : "—",
      icon: <CreditCard size={22} />,
      color: "text-card-red",
      bgColor: "bg-card-red-light",
    },
    {
      label: t("contractsEndingSoon"),
      value: overview ? overview.contracts_ending_soon : "—",
      icon: <FileText size={22} />,
      color: "text-card-orange",
      bgColor: "bg-card-orange-light",
    },
    {
      label: t("maintenanceNotifications"),
      value: overview ? overview.maintenance_notifications : "—",
      icon: <Wrench size={22} />,
      color: "text-card-red",
      bgColor: "bg-card-red-light",
    },
  ];

  const recentNotifs = [...data.notifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-1">
        {t("rentOverview")}
      </h1>
      <p className="text-text-secondary text-xs sm:text-sm mb-4 sm:mb-6">{t("welcome")}</p>
      {loadingOverview && (
        <div className="mb-3 flex items-center">
          <LoadingLottie size={40} />
        </div>
      )}
      {overviewError && (
        <p className="text-xs sm:text-sm text-card-red mb-3">{overviewError}</p>
      )}

      <div className="rent-kpis grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-5 mb-8">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-surface-border p-3 sm:p-5">
        <h2 className="text-base sm:text-lg font-semibold text-text-primary mb-3 sm:mb-4">
          {t("recentActivity")}
        </h2>
        {recentNotifs.length === 0 ? (
          <p className="text-text-muted text-sm">{t("noData")}</p>
        ) : (
          <div className="space-y-3">
            {recentNotifs.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-colors ${
                  n.read
                    ? "border-surface-border bg-background"
                    : "border-primary/20 bg-primary-light"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    n.type === "late_payment"
                      ? "bg-card-red-light text-card-red"
                      : n.type === "contract_ending"
                        ? "bg-card-orange-light text-card-orange"
                        : n.type === "maintenance"
                          ? "bg-card-blue-light text-card-blue"
                          : "bg-card-green-light text-card-green"
                  }`}
                >
                  {n.type === "late_payment" ? (
                    <CreditCard size={14} />
                  ) : n.type === "contract_ending" ? (
                    <FileText size={14} />
                  ) : n.type === "maintenance" ? (
                    <Wrench size={14} />
                  ) : (
                    <AlertTriangle size={14} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {locale === "ar" ? n.titleAr : n.title}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {locale === "ar" ? n.messageAr : n.message}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{n.createdAt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
