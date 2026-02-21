"use client";

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
import { KpiCard } from "@/components/ui";
import { useTranslation } from "@/lib/translation-context";
import { useRent } from "@/modules/rent/rent-context";

export default function RentOverviewPage() {
  const { t, locale } = useTranslation();
  const { data } = useRent();

  const totalProperties = data.properties.length;
  const totalUnits = data.properties.reduce((s, p) => s + p.totalUnits, 0);
  const rentedUnits = data.properties.reduce((s, p) => s + p.rentedUnits, 0);
  const vacantUnits = data.properties.reduce((s, p) => s + p.vacantUnits, 0);
  const maintUnits = data.properties.reduce((s, p) => s + p.maintenanceUnits, 0);
  const totalTenants = data.tenants.length;
  const monthlyIncome = data.properties.reduce((s, p) => s + p.monthlyIncome, 0);
  const latePayments = data.payments.filter((p) => p.status === "overdue").length;
  const contractsEnding = data.contracts.filter((c) => {
    if (c.status !== "active") return false;
    const end = new Date(c.endDate);
    const now = new Date();
    const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 60;
  }).length;
  const openMaintenance = data.maintenanceRequests.filter(
    (m) => m.status === "open" || m.status === "in_progress"
  ).length;

  const occupancy = totalUnits > 0 ? Math.round((rentedUnits / totalUnits) * 100) : 0;

  const kpis = [
    {
      label: t("totalProperties"),
      value: totalProperties,
      icon: <Building2 size={22} />,
      color: "text-card-blue",
      bgColor: "bg-card-blue-light",
    },
    {
      label: t("rentedUnits"),
      value: `${rentedUnits} / ${totalUnits}`,
      icon: <Home size={22} />,
      color: "text-card-green",
      bgColor: "bg-card-green-light",
      trend: `${occupancy}% ${t("occupancyRate")}`,
    },
    {
      label: t("vacantUnits"),
      value: vacantUnits,
      icon: <Building2 size={22} />,
      color: "text-card-orange",
      bgColor: "bg-card-orange-light",
    },
    {
      label: t("totalTenants"),
      value: totalTenants,
      icon: <Users size={22} />,
      color: "text-card-blue",
      bgColor: "bg-card-blue-light",
    },
    {
      label: t("monthlyIncome"),
      value: `$${monthlyIncome.toLocaleString()}`,
      icon: <TrendingUp size={22} />,
      color: "text-card-green",
      bgColor: "bg-card-green-light",
    },
    {
      label: t("latePayments"),
      value: latePayments,
      icon: <CreditCard size={22} />,
      color: "text-card-red",
      bgColor: "bg-card-red-light",
    },
    {
      label: t("contractsEndingSoon"),
      value: contractsEnding,
      icon: <FileText size={22} />,
      color: "text-card-orange",
      bgColor: "bg-card-orange-light",
    },
    {
      label: t("maintenanceNotifications"),
      value: openMaintenance,
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

      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5 mb-8">
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
