"use client";

import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { BarChart3, Building2, DollarSign, FileDown, Users, Zap } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { KpiCard, LoadingLottie } from "@/components/ui";
import { electricityReportsStore } from "./store";
import type { ElectricityReportType } from "./types";

function useMobxRender() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const dispose = autorun(() => {
      void electricityReportsStore.observerSnapshot;
      setTick((prev) => prev + 1);
    });

    return () => dispose();
  }, []);
}

function formatMoney(value: number): string {
  return `USD ${value.toFixed(2)}`;
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const store = electricityReportsStore;
  const [draftFromMonth, setDraftFromMonth] = useState("");
  const [draftToMonth, setDraftToMonth] = useState("");

  useMobxRender();

  useEffect(() => {
    void store.bootstrap(t("error"));
  }, [store, t]);

  useEffect(() => {
    setDraftFromMonth(store.fromMonth);
    setDraftToMonth(store.toMonth);
  }, [store.fromMonth, store.toMonth]);

  const reports: { type: ElectricityReportType; icon: React.ReactNode; label: string }[] = [
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
        <button
          disabled
          className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-not-allowed flex items-center gap-2 opacity-70"
        >
          <FileDown size={16} />
          {t("exportPdf")}
        </button>
      </div>

      {store.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {store.error}
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {reports.map((report) => (
          <button
            key={report.type}
            onClick={() => store.setReportType(report.type)}
            className={`h-9 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 cursor-pointer border-0 transition-colors whitespace-nowrap shrink-0 ${
              store.reportType === report.type
                ? "bg-primary text-white"
                : "bg-surface text-text-secondary hover:text-primary hover:bg-primary-light"
            }`}
          >
            {report.icon} {report.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary">{t("fromMonth")}:</label>
          <input
            type="month"
            value={draftFromMonth}
            onChange={(event) => setDraftFromMonth(event.target.value)}
            className="h-9 rounded-lg border border-surface-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary">{t("toMonth")}:</label>
          <input
            type="month"
            value={draftToMonth}
            onChange={(event) => setDraftToMonth(event.target.value)}
            className="h-9 rounded-lg border border-surface-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() =>
            void store.loadReports({
              errorFallback: t("error"),
              force: true,
              fromMonth: draftFromMonth || undefined,
              toMonth: draftToMonth || undefined,
            })
          }
          disabled={store.loading}
          className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium cursor-pointer border-0 hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("filter")}
        </button>
      </div>

      {store.loading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : (
        <>
          {store.reportType === "consumption" && (
            <div className="space-y-6">
              <KpiCard
                label={t("totalConsumption")}
                value={`${store.totalConsumption.toLocaleString()} ${t("kwh")}`}
                icon={<Zap size={22} />}
                color="text-card-orange"
                bgColor="bg-card-orange-light"
              />
              <div className="bg-surface rounded-xl border border-surface-border p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4">{t("consumptionReport")}</h3>
                <div className="flex items-end gap-3 h-48">
                  {store.consumptionByMonth.map((item) => {
                    const h = (item.consumption_kwh / store.maxConsumption) * 100;
                    return (
                      <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-text-primary">
                          {item.consumption_kwh.toLocaleString()}
                        </span>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-card-orange to-card-yellow transition-all duration-500"
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-[10px] text-text-muted">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {store.reportType === "revenue" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard
                  label={t("totalBilled")}
                  value={formatMoney(store.totalBilled)}
                  icon={<DollarSign size={22} />}
                  color="text-card-blue"
                  bgColor="bg-card-blue-light"
                />
                <KpiCard
                  label={t("totalCollected")}
                  value={formatMoney(store.totalPaid)}
                  icon={<DollarSign size={22} />}
                  color="text-card-green"
                  bgColor="bg-card-green-light"
                />
                <KpiCard
                  label={t("totalOutstanding")}
                  value={formatMoney(store.totalOutstanding)}
                  icon={<DollarSign size={22} />}
                  color="text-card-red"
                  bgColor="bg-card-red-light"
                />
              </div>
              <div className="bg-surface rounded-xl border border-surface-border p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4">{t("revenueReport")}</h3>
                <div className="flex items-end gap-4 h-48">
                  {store.revenueByMonth.map((item) => (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-text-primary">
                        {formatMoney(item.billed_amount)}
                      </span>
                      <div className="w-full flex gap-1 items-end" style={{ height: "85%" }}>
                        <div
                          className="flex-1 rounded-t-md bg-card-blue transition-all duration-500"
                          style={{ height: `${(item.billed_amount / store.maxRevenue) * 100}%` }}
                        />
                        <div
                          className="flex-1 rounded-t-md bg-card-green transition-all duration-500"
                          style={{ height: `${(item.collected_amount / store.maxRevenue) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-text-muted">{item.month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 justify-center">
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <span className="w-3 h-3 rounded-sm bg-card-blue inline-block" /> {t("totalBilled")}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <span className="w-3 h-3 rounded-sm bg-card-green inline-block" /> {t("totalCollected")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {store.reportType === "debt" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <KpiCard
                  label={t("totalOutstanding")}
                  value={formatMoney(store.totalOutstanding)}
                  icon={<DollarSign size={22} />}
                  color="text-card-red"
                  bgColor="bg-card-red-light"
                />
                <KpiCard
                  label={t("collectionRate")}
                  value={`${store.collectionRate.toFixed(1)}%`}
                  icon={<BarChart3 size={22} />}
                  color="text-card-green"
                  bgColor="bg-card-green-light"
                />
              </div>
              <div className="bg-surface rounded-xl border border-surface-border p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-3">{t("debtBreakdown")}</h3>
                <div className="h-4 bg-background rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-card-green to-primary rounded-full transition-all duration-500"
                    style={{ width: `${store.collectionRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-text-muted">
                  <span>{t("totalCollected")}: {formatMoney(store.totalPaid)}</span>
                  <span>{t("totalOutstanding")}: {formatMoney(store.totalOutstanding)}</span>
                </div>
              </div>
            </div>
          )}

          {store.reportType === "building" && (
            <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
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
                    {store.buildingBreakdown.map((item) => (
                      <tr
                        key={item.property_id}
                        className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-text-primary">{item.property_name}</td>
                        <td className="px-4 py-3 text-text-secondary">{item.total_subscribers}</td>
                        <td className="px-4 py-3 text-text-secondary">
                          {item.total_consumption.toLocaleString()} {t("kwh")}
                        </td>
                        <td className="px-4 py-3 font-medium text-card-green">
                          {formatMoney(item.total_revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden divide-y divide-surface-border">
                {store.buildingBreakdown.map((item) => (
                  <div key={item.property_id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text-primary text-sm">{item.property_name}</span>
                      <span className="font-semibold text-card-green text-sm">
                        {formatMoney(item.total_revenue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">{item.total_subscribers} {t("totalSubscribers")}</span>
                      <span className="text-text-secondary">
                        {item.total_consumption.toLocaleString()} {t("kwh")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {store.reportType === "subscriber" && (
            <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
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
                    {store.subscriberBreakdown.map((item) => (
                      <tr
                        key={item.subscriber_id}
                        className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-text-primary">{item.subscriber_name}</td>
                        <td className="px-4 py-3 text-text-secondary">
                          {item.total_consumption.toLocaleString()} {t("kwh")}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{formatMoney(item.total_billed)}</td>
                        <td className="px-4 py-3 text-card-green">{formatMoney(item.total_paid)}</td>
                        <td className="px-4 py-3 font-medium text-card-red">
                          {formatMoney(item.total_outstanding)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden divide-y divide-surface-border">
                {store.subscriberBreakdown.map((item) => (
                  <div key={item.subscriber_id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text-primary text-sm">{item.subscriber_name}</span>
                      <span className="text-xs text-text-secondary">
                        {item.total_consumption.toLocaleString()} {t("kwh")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">{t("totalBilled")}: {formatMoney(item.total_billed)}</span>
                      <span className="text-card-green">{t("totalPaid")}: {formatMoney(item.total_paid)}</span>
                    </div>
                    <div className="flex items-center justify-end">
                      <span className="text-xs font-medium text-card-red">
                        {t("totalOutstanding")}: {formatMoney(item.total_outstanding)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
