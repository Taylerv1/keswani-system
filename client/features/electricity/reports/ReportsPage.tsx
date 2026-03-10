"use client";

import { useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { BarChart3, Building2, DollarSign, FileDown, Gauge, Users, Zap } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { KpiCard, LoadingLottie } from "@/components/ui";
import { useElectricity } from "@/features/electricity/context/electricity-context";
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

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function ConsumptionChart({
  data,
}: {
  data: Array<{ month: string; consumption_kwh: number }>;
}) {
  if (!data.length) {
    return <div className="text-sm text-text-muted">No data</div>;
  }

  const width = Math.max(640, data.length * 90);
  const height = 300;
  const paddingLeft = 56;
  const paddingRight = 24;
  const paddingTop = 24;
  const paddingBottom = 54;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  const maxValue = Math.max(...data.map((item) => item.consumption_kwh), 1);

  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? paddingLeft + plotWidth / 2
        : paddingLeft + (index * plotWidth) / (data.length - 1);
    const y = paddingTop + (1 - item.consumption_kwh / maxValue) * plotHeight;
    return { x, y, label: item.month, value: item.consumption_kwh };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${
    paddingTop + plotHeight
  } L ${points[0].x} ${paddingTop + plotHeight} Z`;

  return (
    <div className="overflow-x-auto">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Consumption chart"
      >
        <defs>
          <linearGradient id="consumptionArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3, 4].map((step) => {
          const y = paddingTop + (step * plotHeight) / 4;
          const value = Math.round(((4 - step) * maxValue) / 4);
          return (
            <g key={`grid-${step}`}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#e5e7eb"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#6b7280"
              >
                {value}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#consumptionArea)" />
        <path d={linePath} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />

        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4.5" fill="#f97316" />
            <text x={point.x} y={point.y - 10} textAnchor="middle" fontSize="10" fill="#374151">
              {point.value.toFixed(0)}
            </text>
            <text
              x={point.x}
              y={height - 18}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function RevenueChart({
  data,
}: {
  data: Array<{ month: string; billed_amount: number; collected_amount: number }>;
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
  const maxValue = Math.max(
    ...data.map((item) => Math.max(item.billed_amount, item.collected_amount)),
    1
  );

  return (
    <div className="overflow-x-auto">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Revenue chart"
      >
        {[0, 1, 2, 3, 4].map((step) => {
          const y = paddingTop + (step * plotHeight) / 4;
          const value = ((4 - step) * maxValue) / 4;
          return (
            <g key={`rev-grid-${step}`}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#e5e7eb"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#6b7280"
              >
                {value.toFixed(0)}
              </text>
            </g>
          );
        })}

        {data.map((item, index) => {
          const groupWidth = plotWidth / data.length;
          const xStart = paddingLeft + index * groupWidth + groupWidth * 0.18;
          const barWidth = Math.max(12, groupWidth * 0.26);
          const billedHeight = (item.billed_amount / maxValue) * plotHeight;
          const collectedHeight = (item.collected_amount / maxValue) * plotHeight;
          const billedY = paddingTop + plotHeight - billedHeight;
          const collectedY = paddingTop + plotHeight - collectedHeight;

          return (
            <g key={`group-${item.month}`}>
              <rect
                x={xStart}
                y={billedY}
                width={barWidth}
                height={billedHeight}
                rx="4"
                fill="#3b82f6"
              />
              <rect
                x={xStart + barWidth + groupWidth * 0.12}
                y={collectedY}
                width={barWidth}
                height={collectedHeight}
                rx="4"
                fill="#10b981"
              />
              <text
                x={xStart + barWidth}
                y={height - 24}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {item.month}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function GeneratorEconomicsChart({
  data,
}: {
  data: Array<{ month: string; collected_amount: number; generator_cost: number }>;
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
  const maxValue = Math.max(
    ...data.map((item) => Math.max(item.collected_amount, item.generator_cost)),
    1
  );

  return (
    <div className="overflow-x-auto">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Generator economics chart"
      >
        {[0, 1, 2, 3, 4].map((step) => {
          const y = paddingTop + (step * plotHeight) / 4;
          const value = ((4 - step) * maxValue) / 4;
          return (
            <g key={`gen-grid-${step}`}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#e5e7eb"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#6b7280"
              >
                {value.toFixed(0)}
              </text>
            </g>
          );
        })}

        {data.map((item, index) => {
          const groupWidth = plotWidth / data.length;
          const xStart = paddingLeft + index * groupWidth + groupWidth * 0.18;
          const barWidth = Math.max(12, groupWidth * 0.26);
          const collectedHeight = (item.collected_amount / maxValue) * plotHeight;
          const costHeight = (item.generator_cost / maxValue) * plotHeight;
          const collectedY = paddingTop + plotHeight - collectedHeight;
          const costY = paddingTop + plotHeight - costHeight;

          return (
            <g key={`gen-group-${item.month}`}>
              <rect
                x={xStart}
                y={collectedY}
                width={barWidth}
                height={collectedHeight}
                rx="4"
                fill="#10b981"
              />
              <rect
                x={xStart + barWidth + groupWidth * 0.12}
                y={costY}
                width={barWidth}
                height={costHeight}
                rx="4"
                fill="#f97316"
              />
              <text
                x={xStart + barWidth}
                y={height - 24}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {item.month}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const { data: electricityData } = useElectricity();
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

  const settings = electricityData.settings;
  const monthCount = Math.max(
    store.revenueByMonth.length,
    store.consumptionByMonth.length,
    1
  );
  const monthlyFuelLiters =
    Math.max(0, settings.generatorMonthlyOperatingHours) *
    Math.max(0, settings.generatorFuelConsumptionPerHour);
  const monthlyFuelCost = monthlyFuelLiters * Math.max(0, settings.generatorFuelCostPerLiter);
  const monthlyGeneratorCost = monthlyFuelCost + Math.max(0, settings.generatorMaintenanceCostMonthly);
  const estimatedGeneratorCost = monthlyGeneratorCost * monthCount;
  const estimatedNetAfterGenerator = store.totalPaid - estimatedGeneratorCost;
  const generatorCostPerKwh =
    store.totalConsumption > 0 ? estimatedGeneratorCost / store.totalConsumption : 0;

  const generatorEconomicsByMonth = useMemo(
    () =>
      store.revenueByMonth.map((item) => ({
        month: item.month,
        collected_amount: item.collected_amount,
        generator_cost: Number(monthlyGeneratorCost.toFixed(2)),
      })),
    [monthlyGeneratorCost, store.revenueByMonth]
  );

  const exportCurrentReportPdf = () => {
    const reportLabel = reports.find((item) => item.type === store.reportType)?.label ?? t("elecReports");
    const generatedAt = new Date();
    const dateRangeLabel = `${store.fromMonth || "-"} -> ${store.toMonth || "-"}`;

    let headers: string[] = [];
    let rows: string[][] = [];

    if (store.reportType === "consumption") {
      headers = [t("month"), t("totalConsumption"), t("totalBills")];
      rows = store.consumptionByMonth.map((item) => [
        item.month,
        `${item.consumption_kwh.toFixed(2)} ${t("kwh")}`,
        String(item.bills_count),
      ]);
    } else if (store.reportType === "revenue") {
      headers = [t("month"), t("totalBilled"), t("totalCollected"), t("totalOutstanding")];
      rows = store.revenueByMonth.map((item) => [
        item.month,
        formatMoney(item.billed_amount),
        formatMoney(item.collected_amount),
        formatMoney(Math.max(0, item.billed_amount - item.collected_amount)),
      ]);
    } else if (store.reportType === "debt") {
      headers = [t("month"), t("totalBilled"), t("totalCollected"), t("totalOutstanding")];
      rows = store.revenueByMonth.map((item) => [
        item.month,
        formatMoney(item.billed_amount),
        formatMoney(item.collected_amount),
        formatMoney(Math.max(0, item.billed_amount - item.collected_amount)),
      ]);
    } else if (store.reportType === "building") {
      headers = [t("buildingName"), t("totalSubscribers"), t("totalConsumption"), t("totalRevenue")];
      rows = store.buildingBreakdown.map((item) => [
        item.property_name,
        String(item.total_subscribers),
        `${item.total_consumption.toFixed(2)} ${t("kwh")}`,
        formatMoney(item.total_revenue),
      ]);
    } else {
      headers = [t("subscriber"), t("totalConsumption"), t("totalBilled"), t("totalPaid"), t("totalOutstanding")];
      rows = store.subscriberBreakdown.map((item) => [
        item.subscriber_name,
        `${item.total_consumption.toFixed(2)} ${t("kwh")}`,
        formatMoney(item.total_billed),
        formatMoney(item.total_paid),
        formatMoney(item.total_outstanding),
      ]);
    }

    const summaryRows = [
      [t("totalConsumption"), `${store.totalConsumption.toFixed(2)} ${t("kwh")}`],
      [t("totalBilled"), formatMoney(store.totalBilled)],
      [t("totalPaid"), formatMoney(store.totalPaid)],
      [t("totalOutstanding"), formatMoney(store.totalOutstanding)],
      [t("collectionRate"), `${store.collectionRate.toFixed(2)}%`],
      [t("estimatedGeneratorCost"), formatMoney(estimatedGeneratorCost)],
      [t("estimatedNetAfterGenerator"), formatMoney(estimatedNetAfterGenerator)],
      [t("generatorCostPerKwh"), `${formatMoney(generatorCostPerKwh)} / ${t("kwh")}`],
    ];

    const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(reportLabel)} - ${escapeHtml(t("exportPdf"))}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
      h1 { margin: 0 0 6px; font-size: 20px; }
      p { margin: 0 0 6px; color: #6b7280; font-size: 12px; }
      .section-title { margin: 16px 0 8px; font-size: 14px; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }
      th { background: #f9fafb; }
      .summary td:first-child { width: 30%; font-weight: 600; background: #f9fafb; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(reportLabel)}</h1>
    <p>${escapeHtml(t("elecReports"))}</p>
    <p>${escapeHtml(t("date"))}: ${escapeHtml(generatedAt.toISOString().slice(0, 19).replace("T", " "))}</p>
    <p>${escapeHtml(t("fromMonth"))} / ${escapeHtml(t("toMonth"))}: ${escapeHtml(dateRangeLabel)}</p>

    <div class="section-title">${escapeHtml(t("debtSummary"))}</div>
    <table class="summary">
      <tbody>
        ${summaryRows
          .map(
            ([label, value]) =>
              `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`
          )
          .join("")}
      </tbody>
    </table>

    <div class="section-title">${escapeHtml(reportLabel)}</div>
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${
          rows.length
            ? rows
                .map(
                  (row) =>
                    `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
                )
                .join("")
            : `<tr><td colspan="${headers.length}">${escapeHtml(t("noData"))}</td></tr>`
        }
      </tbody>
    </table>
  </body>
</html>
`.trim();

    try {
      const popup = window.open("", "_blank", "width=1024,height=768");
      if (!popup) {
        store.setError(t("error"));
        return;
      }

      popup.document.open();
      popup.document.write(html);
      popup.document.close();

      setTimeout(() => {
        popup.focus();
        popup.print();
        popup.close();
      }, 300);
    } catch {
      store.setError(t("error"));
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("elecReports")}</h1>
          <p className="text-text-secondary text-sm mt-1">{t("reportsDescription")}</p>
        </div>
        <button
          onClick={exportCurrentReportPdf}
          className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:text-primary hover:border-primary/40 transition-colors flex items-center gap-2"
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

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label={t("estimatedGeneratorCost")}
            value={formatMoney(estimatedGeneratorCost)}
            icon={<Zap size={22} />}
            color="text-card-orange"
            bgColor="bg-card-orange-light"
          />
          <KpiCard
            label={t("estimatedNetAfterGenerator")}
            value={formatMoney(estimatedNetAfterGenerator)}
            icon={<DollarSign size={22} />}
            color={estimatedNetAfterGenerator >= 0 ? "text-card-green" : "text-card-red"}
            bgColor={estimatedNetAfterGenerator >= 0 ? "bg-card-green-light" : "bg-card-red-light"}
          />
          <KpiCard
            label={t("generatorCostPerKwh")}
            value={`${formatMoney(generatorCostPerKwh)} / ${t("kwh")}`}
            icon={<Gauge size={22} />}
            color="text-card-blue"
            bgColor="bg-card-blue-light"
          />
          <KpiCard
            label={t("generatorFuelVolume")}
            value={`${monthlyFuelLiters.toFixed(2)} L`}
            icon={<BarChart3 size={22} />}
            color="text-card-blue"
            bgColor="bg-card-blue-light"
          />
        </div>

        <div className="bg-surface rounded-xl border border-surface-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-1">{t("generatorEconomics")}</h3>
          <p className="text-xs text-text-muted mb-4">
            {t("generatorEconomicsHint")}
          </p>
          <GeneratorEconomicsChart data={generatorEconomicsByMonth} />
          <div className="flex items-center gap-4 mt-3 justify-center">
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <span className="w-3 h-3 rounded-sm bg-card-green inline-block" /> {t("totalCollected")}
            </span>
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <span className="w-3 h-3 rounded-sm bg-card-orange inline-block" /> {t("estimatedGeneratorCost")}
            </span>
          </div>
        </div>
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
                <ConsumptionChart data={store.consumptionByMonth} />
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
                <RevenueChart data={store.revenueByMonth} />
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
