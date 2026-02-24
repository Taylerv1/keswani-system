"use client";

import { useState, useMemo } from "react";
import { BarChart3, FileDown, DollarSign, Zap, Building2, Users } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { useElectricity } from "@/features/electricity/context/electricity-context";
import { KpiCard } from "@/components/ui";

type ReportType = "consumption" | "revenue" | "debt" | "building" | "subscriber";

export default function ReportsPage() {
  const { t, locale } = useTranslation();
  const { data } = useElectricity();

  const [reportType, setReportType] = useState<ReportType>("consumption");
  const [fromMonth, setFromMonth] = useState("2025-01");
  const [toMonth, setToMonth] = useState("2026-01");

  const getSubscriberName = (id: string) => {
    const s = data.subscribers.find((x) => x.id === id);
    return s ? (locale === "ar" ? s.nameAr : s.name) : id;
  };

  const getBuildingName = (id: string) => {
    const b = data.buildings.find((x) => x.id === id);
    return b ? (locale === "ar" ? b.nameAr : b.name) : id;
  };

  // filtered bills in date range
  const billsInRange = useMemo(() => {
    return data.bills.filter((b) => b.month >= fromMonth && b.month <= toMonth);
  }, [data.bills, fromMonth, toMonth]);

  // consumption by month
  const consumptionByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of billsInRange) {
      map[b.month] = (map[b.month] || 0) + b.consumption;
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [billsInRange]);

  // revenue by month
  const revenueByMonth = useMemo(() => {
    const map: Record<string, { billed: number; collected: number }> = {};
    for (const b of billsInRange) {
      if (!map[b.month]) map[b.month] = { billed: 0, collected: 0 };
      map[b.month].billed += b.totalAmount;
    }
    for (const p of data.payments) {
      const bill = data.bills.find((b) => b.id === p.billId);
      if (bill && bill.month >= fromMonth && bill.month <= toMonth) {
        if (!map[bill.month]) map[bill.month] = { billed: 0, collected: 0 };
        map[bill.month].collected += p.amount;
      }
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [billsInRange, data.payments, data.bills, fromMonth, toMonth]);

  // per building
  const perBuilding = useMemo(() => {
    const map: Record<string, { consumption: number; revenue: number; subscribers: Set<string> }> = {};
    for (const b of billsInRange) {
      const sub = data.subscribers.find((s) => s.id === b.subscriberId);
      if (!sub) continue;
      if (!map[sub.buildingId]) map[sub.buildingId] = { consumption: 0, revenue: 0, subscribers: new Set() };
      map[sub.buildingId].consumption += b.consumption;
      map[sub.buildingId].revenue += b.totalAmount;
      map[sub.buildingId].subscribers.add(b.subscriberId);
    }
    return Object.entries(map).map(([bId, v]) => ({ buildingId: bId, ...v, subscriberCount: v.subscribers.size }));
  }, [billsInRange, data.subscribers]);

  // per subscriber
  const perSubscriber = useMemo(() => {
    const map: Record<string, { consumption: number; billed: number; paid: number }> = {};
    for (const b of billsInRange) {
      if (!map[b.subscriberId]) map[b.subscriberId] = { consumption: 0, billed: 0, paid: 0 };
      map[b.subscriberId].consumption += b.consumption;
      map[b.subscriberId].billed += b.totalAmount;
    }
    for (const p of data.payments) {
      const bill = data.bills.find((b) => b.id === p.billId);
      if (bill && bill.month >= fromMonth && bill.month <= toMonth) {
        if (!map[bill.subscriberId]) map[bill.subscriberId] = { consumption: 0, billed: 0, paid: 0 };
        map[bill.subscriberId].paid += p.amount;
      }
    }
    return Object.entries(map).sort(([, a], [, b]) => b.consumption - a.consumption);
  }, [billsInRange, data.payments, data.bills, fromMonth, toMonth]);

  // debt summary
  const debtSummary = useMemo(() => {
    let totalBilled = 0, totalPaid = 0;
    for (const b of billsInRange) totalBilled += b.totalAmount;
    for (const p of data.payments) {
      const bill = data.bills.find((b) => b.id === p.billId);
      if (bill && bill.month >= fromMonth && bill.month <= toMonth) totalPaid += p.amount;
    }
    return { totalBilled, totalPaid, outstanding: totalBilled - totalPaid };
  }, [billsInRange, data.payments, data.bills, fromMonth, toMonth]);

  const totalConsumption = consumptionByMonth.reduce((s, [, v]) => s + v, 0);
  const maxConsumption = Math.max(...consumptionByMonth.map(([, v]) => v), 1);
  const maxRevenue = Math.max(...revenueByMonth.map(([, v]) => Math.max(v.billed, v.collected)), 1);

  const reports: { type: ReportType; icon: React.ReactNode; label: string }[] = [
    { type: "consumption", icon: <Zap size={18} />, label: t("consumptionReport") },
    { type: "revenue", icon: <DollarSign size={18} />, label: t("revenueReport") },
    { type: "debt", icon: <BarChart3 size={18} />, label: t("debtReport") },
    { type: "building", icon: <Building2 size={18} />, label: t("buildingReport") },
    { type: "subscriber", icon: <Users size={18} />, label: t("subscriberReport") },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("elecReports")}</h1>
          <p className="text-text-secondary text-sm mt-1">{t("reportsDescription")}</p>
        </div>
        <button onClick={() => alert("PDF export mock")} className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-primary hover:border-primary/40 transition-colors text-sm font-medium cursor-pointer flex items-center gap-2">
          <FileDown size={16} />
          {t("exportPdf")}
        </button>
      </div>

      {/* Report tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {reports.map((r) => (
          <button key={r.type} onClick={() => setReportType(r.type)} className={`h-9 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 cursor-pointer border-0 transition-colors whitespace-nowrap shrink-0 ${reportType === r.type ? "bg-primary text-white" : "bg-surface text-text-secondary hover:text-primary hover:bg-primary-light"}`}>
            {r.icon} {r.label}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary">{t("fromMonth")}:</label>
          <input type="month" value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} className="h-9 rounded-lg border border-surface-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary">{t("toMonth")}:</label>
          <input type="month" value={toMonth} onChange={(e) => setToMonth(e.target.value)} className="h-9 rounded-lg border border-surface-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      {/* Consumption Report */}
      {reportType === "consumption" && (
        <div className="space-y-6">
          <KpiCard label={t("totalConsumption")} value={`${totalConsumption} ${t("kwh")}`} icon={<Zap size={22} />} color="text-card-orange" bgColor="bg-card-orange-light" />
          <div className="bg-surface rounded-xl border border-surface-border p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">{t("consumptionReport")}</h3>
            <div className="flex items-end gap-3 h-48">
              {consumptionByMonth.map(([month, val]) => {
                const h = (val / maxConsumption) * 100;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-text-primary">{val}</span>
                    <div className="w-full rounded-t-lg bg-gradient-to-t from-card-orange to-card-yellow transition-all duration-500" style={{ height: `${h}%` }} />
                    <span className="text-[10px] text-text-muted">{month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Report */}
      {reportType === "revenue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard label={t("totalBilled")} value={`$${debtSummary.totalBilled.toFixed(2)}`} icon={<DollarSign size={22} />} color="text-card-blue" bgColor="bg-card-blue-light" />
            <KpiCard label={t("totalCollected")} value={`$${debtSummary.totalPaid.toFixed(2)}`} icon={<DollarSign size={22} />} color="text-card-green" bgColor="bg-card-green-light" />
            <KpiCard label={t("totalOutstanding")} value={`$${debtSummary.outstanding.toFixed(2)}`} icon={<DollarSign size={22} />} color="text-card-red" bgColor="bg-card-red-light" />
          </div>
          <div className="bg-surface rounded-xl border border-surface-border p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">{t("revenueReport")}</h3>
            <div className="flex items-end gap-4 h-48">
              {revenueByMonth.map(([month, { billed, collected }]) => (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-text-primary">${billed.toFixed(0)}</span>
                  <div className="w-full flex gap-1 items-end" style={{ height: "85%" }}>
                    <div className="flex-1 rounded-t-md bg-card-blue transition-all duration-500" style={{ height: `${(billed / maxRevenue) * 100}%` }} />
                    <div className="flex-1 rounded-t-md bg-card-green transition-all duration-500" style={{ height: `${(collected / maxRevenue) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-text-muted">{month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 justify-center">
              <span className="flex items-center gap-1 text-xs text-text-muted"><span className="w-3 h-3 rounded-sm bg-card-blue inline-block" /> {t("totalBilled")}</span>
              <span className="flex items-center gap-1 text-xs text-text-muted"><span className="w-3 h-3 rounded-sm bg-card-green inline-block" /> {t("totalCollected")}</span>
            </div>
          </div>
        </div>
      )}

      {/* Debt Report */}
      {reportType === "debt" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard label={t("totalOutstanding")} value={`$${debtSummary.outstanding.toFixed(2)}`} icon={<DollarSign size={22} />} color="text-card-red" bgColor="bg-card-red-light" />
            <KpiCard label={t("collectionRate")} value={debtSummary.totalBilled > 0 ? `${((debtSummary.totalPaid / debtSummary.totalBilled) * 100).toFixed(1)}%` : "0%"} icon={<BarChart3 size={22} />} color="text-card-green" bgColor="bg-card-green-light" />
          </div>
          <div className="bg-surface rounded-xl border border-surface-border p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t("debtBreakdown")}</h3>
            <div className="h-4 bg-background rounded-full overflow-hidden mb-3">
              {debtSummary.totalBilled > 0 && (
                <div className="h-full bg-gradient-to-r from-card-green to-primary rounded-full transition-all duration-500" style={{ width: `${(debtSummary.totalPaid / debtSummary.totalBilled) * 100}%` }} />
              )}
            </div>
            <div className="flex justify-between text-xs text-text-muted">
              <span>{t("totalCollected")}: ${debtSummary.totalPaid.toFixed(2)}</span>
              <span>{t("totalOutstanding")}: ${debtSummary.outstanding.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Building Report */}
      {reportType === "building" && (
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-background">
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("buildingName")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("totalSubscribers")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("totalConsumption")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("totalRevenue")}</th>
                </tr>
              </thead>
              <tbody>
                {perBuilding.map((b) => (
                  <tr key={b.buildingId} className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{getBuildingName(b.buildingId)}</td>
                    <td className="px-4 py-3 text-text-secondary">{b.subscriberCount}</td>
                    <td className="px-4 py-3 text-text-secondary">{b.consumption} {t("kwh")}</td>
                    <td className="px-4 py-3 font-medium text-card-green">${b.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-surface-border">
            {perBuilding.map((b) => (
              <div key={b.buildingId} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text-primary text-sm">{getBuildingName(b.buildingId)}</span>
                  <span className="font-semibold text-card-green text-sm">${b.revenue.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{b.subscriberCount} {t("totalSubscribers")}</span>
                  <span className="text-text-secondary">{b.consumption} {t("kwh")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscriber Report */}
      {reportType === "subscriber" && (
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-background">
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriber")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("totalConsumption")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("totalBilled")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("totalPaid")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("totalOutstanding")}</th>
                </tr>
              </thead>
              <tbody>
                {perSubscriber.map(([subId, vals]) => (
                  <tr key={subId} className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{getSubscriberName(subId)}</td>
                    <td className="px-4 py-3 text-text-secondary">{vals.consumption} {t("kwh")}</td>
                    <td className="px-4 py-3 text-text-secondary">${vals.billed.toFixed(2)}</td>
                    <td className="px-4 py-3 text-card-green">${vals.paid.toFixed(2)}</td>
                    <td className="px-4 py-3 font-medium text-card-red">${(vals.billed - vals.paid).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-surface-border">
            {perSubscriber.map(([subId, vals]) => (
              <div key={subId} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text-primary text-sm">{getSubscriberName(subId)}</span>
                  <span className="text-xs text-text-secondary">{vals.consumption} {t("kwh")}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{t("totalBilled")}: ${vals.billed.toFixed(2)}</span>
                  <span className="text-card-green">{t("totalPaid")}: ${vals.paid.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-end">
                  <span className="text-xs font-medium text-card-red">{t("totalOutstanding")}: ${(vals.billed - vals.paid).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
