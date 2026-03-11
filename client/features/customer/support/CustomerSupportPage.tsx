"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { Home, Send, Wrench, Zap } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { useCustomer } from "@/features/profile/context/customer-context";
import {
  LoadingLottie,
  Pagination,
  SearchBar,
  SelectMenu,
  StatusBadge,
  type SelectOption,
} from "@/components/ui";
import { formatDate } from "@/features/customer/maintenance/utils";
import { supportStore } from "./store";
import type {
  SupportTab,
  CustomerMaintenanceItem,
  CustomerElectricityIssue,
} from "./types";

/* ── MobX reactivity hook ── */

function useMobxRender() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const dispose = autorun(() => {
      void supportStore.observerSnapshot;
      setTick((prev) => prev + 1);
    });

    return () => dispose();
  }, []);
}

/* ── Maintenance Form (Rent tab) ── */

function MaintenanceForm({
  t,
  creating,
}: {
  t: (key: string) => string;
  creating: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const parseEstimatedCost = (input: string): number | undefined => {
    const trimmed = input.trim();
    if (!trimmed) return undefined;

    const latinized = trimmed
      .replace(/[\u0660-\u0669]/g, (digit) =>
        String(digit.charCodeAt(0) - 0x0660),
      )
      .replace(/[\u06F0-\u06F9]/g, (digit) =>
        String(digit.charCodeAt(0) - 0x06f0),
      );

    let normalized = latinized
      .replace(/[^0-9.,+\-\u066B\u066C]/g, "")
      .replace(/\u066B/g, ".")
      .replace(/\u066C/g, ",");

    const hasDot = normalized.includes(".");
    const hasComma = normalized.includes(",");

    if (hasDot && hasComma) {
      normalized = normalized.replace(/,/g, "");
    } else if (!hasDot && hasComma) {
      normalized = normalized.replace(/,/g, ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed < 0) return Number.NaN;
    return parsed;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const parsedCost = parseEstimatedCost(estimatedCost);
    if (parsedCost !== undefined && Number.isNaN(parsedCost)) return;

    const success = await supportStore.submitMaintenanceRequest(
      {
        title: title.trim(),
        description: description.trim(),
        estimated_cost: parsedCost,
      },
      {
        errorFallback: t("error"),
        successMessage: t("custMaintenanceSubmitted"),
      },
    );

    if (success) {
      setTitle("");
      setDescription("");
      setEstimatedCost("");
      setSubmitted(true);
      window.setTimeout(() => setSubmitted(false), 2500);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-surface-border p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        {t("custCreateMaintenanceRequest")}
      </h3>

      {submitted && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-card-green-light text-card-green text-sm font-medium">
          {t("custMaintenanceSubmitted")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {t("maintenanceTitle")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("custMaintenanceTitlePlaceholder")}
            required
            className="w-full h-10 px-3 rounded-lg border border-surface-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {t("description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("custMaintenanceDescPlaceholder")}
            required
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-surface-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {t("maintenanceCost")}
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            placeholder={t("custMaintenanceCostPlaceholder")}
            className="w-full h-10 px-3 rounded-lg border border-surface-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={creating || !title.trim() || !description.trim()}
          className="w-full h-11 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg hover:shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer border-0 flex items-center justify-center gap-2"
        >
          {creating ? (
            <LoadingLottie size={28} />
          ) : (
            <>
              <Send size={16} />
              {t("custSubmitMaintenanceRequest")}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

/* ── Electricity Issue Form (Electricity tab) ── */

function ElectricityIssueForm({
  t,
  creating,
}: {
  t: (key: string) => string;
  creating: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [submitted, setSubmitted] = useState(false);

  const categoryOptions: SelectOption[] = useMemo(
    () => [
      { value: "billing", label: t("custIssueCategoryBilling") },
      { value: "meter", label: t("custIssueCategoryMeter") },
      { value: "connection", label: t("custIssueCategoryConnection") },
      { value: "other", label: t("custIssueCategoryOther") },
    ],
    [t],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const success = await supportStore.submitElectricityIssue(
      {
        title: title.trim(),
        description: description.trim(),
        category,
      },
      {
        errorFallback: t("error"),
        successMessage: t("custElecIssueSubmitted"),
      },
    );

    if (success) {
      setTitle("");
      setDescription("");
      setCategory("other");
      setSubmitted(true);
      window.setTimeout(() => setSubmitted(false), 2500);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-surface-border p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        {t("custCreateElecIssue")}
      </h3>

      {submitted && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-card-green-light text-card-green text-sm font-medium">
          {t("custElecIssueSubmitted")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {t("maintenanceTitle")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("custElecIssueTitlePlaceholder")}
            required
            className="w-full h-10 px-3 rounded-lg border border-surface-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {t("custIssueCategory")}
          </label>
          <SelectMenu
            value={category}
            onChange={setCategory}
            options={categoryOptions}
            placeholder={t("custIssueCategoryOther")}
            noResultsLabel={t("noResults")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {t("description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("custElecIssueDescPlaceholder")}
            required
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-surface-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={creating || !title.trim() || !description.trim()}
          className="w-full h-11 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg hover:shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer border-0 flex items-center justify-center gap-2"
        >
          {creating ? (
            <LoadingLottie size={28} />
          ) : (
            <>
              <Send size={16} />
              {t("custSubmitElecIssue")}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

/* ── Maintenance Request List ── */

function MaintenanceList({
  items,
  locale,
  t,
}: {
  items: CustomerMaintenanceItem[];
  locale: string;
  t: (key: string) => string;
}) {
  if (items.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-surface-border p-8 text-center">
        <Wrench size={36} className="mx-auto text-text-muted mb-3" />
        <p className="text-text-secondary text-sm">
          {t("custNoMaintenanceRequests")}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-border">
        <h3 className="text-sm font-semibold text-text-primary">
          {t("custPreviousMaintenanceRequests")}
        </h3>
      </div>
      <div className="divide-y divide-surface-border">
        {items.map((item) => (
          <div
            key={item.id}
            className="px-5 py-4 hover:bg-background/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {item.title}
                </p>
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                  {item.description || "-"}
                </p>
              </div>
              <div className="shrink-0">
                <StatusBadge status={item.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
              <p>
                {t("property")}: {item.propertyName} - {item.unitNumber}
              </p>
              <p className="text-end">
                {t("priority")}:{" "}
                <span className="font-medium">{t(item.priority)}</span>
              </p>
              <p>
                {t("createdAt")}: {formatDate(item.createdAt, locale)}
              </p>
              <p className="text-end">
                {t("updatedAt")}: {formatDate(item.updatedAt, locale)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Electricity Issue List ── */

const categoryTranslationMap: Record<string, string> = {
  billing: "custIssueCategoryBilling",
  meter: "custIssueCategoryMeter",
  connection: "custIssueCategoryConnection",
  other: "custIssueCategoryOther",
};

function ElectricityIssueList({
  items,
  locale,
  t,
}: {
  items: CustomerElectricityIssue[];
  locale: string;
  t: (key: string) => string;
}) {
  if (items.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-surface-border p-8 text-center">
        <Zap size={36} className="mx-auto text-text-muted mb-3" />
        <p className="text-text-secondary text-sm">{t("custNoElecIssues")}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-border">
        <h3 className="text-sm font-semibold text-text-primary">
          {t("custPreviousElecIssues")}
        </h3>
      </div>
      <div className="divide-y divide-surface-border">
        {items.map((item) => (
          <div
            key={item.id}
            className="px-5 py-4 hover:bg-background/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {item.title}
                </p>
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                  {item.description || "-"}
                </p>
              </div>
              <div className="shrink-0">
                <StatusBadge status={item.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
              <p>
                {t("custIssueCategory")}:{" "}
                <span className="font-medium">
                  {t(categoryTranslationMap[item.category] ?? item.category)}
                </span>
              </p>
              <p className="text-end">
                {t("priority")}:{" "}
                <span className="font-medium">{t(item.priority)}</span>
              </p>
              <p>
                {t("createdAt")}: {formatDate(item.createdAt, locale)}
              </p>
              <p className="text-end">
                {t("updatedAt")}: {formatDate(item.updatedAt, locale)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page Component ── */

export default function CustomerSupportPage() {
  const { t, locale } = useTranslation();
  const store = supportStore;
  const { hasRentData, hasElectricityData } = useCustomer();

  useMobxRender();

  // Determine available tabs & default
  const availableTabs: SupportTab[] = useMemo(() => {
    const tabs: SupportTab[] = [];
    if (hasRentData) tabs.push("rent");
    if (hasElectricityData) tabs.push("electricity");
    return tabs.length > 0 ? tabs : ["rent"];
  }, [hasRentData, hasElectricityData]);

  const showTabBar = availableTabs.length > 1;

  useEffect(() => {
    // Set initial tab to the first available
    const initialTab = availableTabs[0];
    store.setTab(initialTab);
    void store.bootstrap(t("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Status filter options differ per tab
  const statusOptions = useMemo<SelectOption[]>(() => {
    if (store.tab === "rent") {
      return [
        { value: "all", label: `${t("all")} - ${t("status")}` },
        { value: "open", label: t("open") },
        { value: "in_progress", label: t("inProgress") },
        { value: "completed", label: t("completed") },
        { value: "closed", label: t("closed") },
      ];
    }
    return [
      { value: "all", label: `${t("all")} - ${t("status")}` },
      { value: "open", label: t("open") },
      { value: "in_progress", label: t("inProgress") },
      { value: "resolved", label: t("resolved") },
      { value: "closed", label: t("closed") },
    ];
  }, [t, store.tab]);

  const tabConfig: {
    key: SupportTab;
    labelKey: string;
    icon: React.ReactNode;
  }[] = [
    { key: "rent", labelKey: "custSupportRentTab", icon: <Home size={14} /> },
    {
      key: "electricity",
      labelKey: "custSupportElecTab",
      icon: <Zap size={14} />,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {t("custSupport")}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {t("custSupportSubtitle")}
        </p>
      </div>

      {/* Flash messages */}
      {store.error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-card-red-light text-card-red text-sm">
          {store.error}
        </div>
      )}
      {store.success && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-card-green-light text-card-green text-sm font-medium">
          {store.success}
        </div>
      )}

      {/* Tabs (only if user has both rent + electricity) */}
      {showTabBar && (
        <div className="flex items-center gap-1 mb-5 border-b border-surface-border">
          {tabConfig
            .filter((tab) => availableTabs.includes(tab.key))
            .map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  store.setTab(tab.key);
                  void store.loadItems({ errorFallback: t("error") });
                }}
                className={`
                  flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer bg-transparent
                  ${
                    store.tab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }
                `}
              >
                {tab.icon}
                {t(tab.labelKey)}
              </button>
            ))}
        </div>
      )}

      {/* Content: Form + List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        {store.tab === "rent" ? (
          <MaintenanceForm t={t} creating={store.creating} />
        ) : (
          <ElectricityIssueForm t={t} creating={store.creating} />
        )}

        {/* List */}
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchBar
                value={store.search}
                onChange={(value) => {
                  store.setSearch(value);
                  void store.loadItems({ errorFallback: t("error") });
                }}
              />
            </div>
            <div className="sm:w-48">
              <SelectMenu
                value={store.statusFilter}
                onChange={(value) => {
                  store.setStatusFilter(value);
                  void store.loadItems({ errorFallback: t("error") });
                }}
                options={statusOptions}
                placeholder={`${t("all")} - ${t("status")}`}
                noResultsLabel={t("noResults")}
              />
            </div>
          </div>

          {/* Items */}
          {store.loading ? (
            <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
              <LoadingLottie size={140} className="p-4" />
            </div>
          ) : store.tab === "rent" ? (
            <MaintenanceList
              items={store.items as CustomerMaintenanceItem[]}
              locale={locale}
              t={t}
            />
          ) : (
            <ElectricityIssueList
              items={store.items as CustomerElectricityIssue[]}
              locale={locale}
              t={t}
            />
          )}

          {/* Pagination */}
          <Pagination
            currentPage={store.page}
            totalPages={store.totalPages}
            totalItems={store.totalItems}
            pageSize={store.PAGE_SIZE}
            onPageChange={(nextPage) => {
              store.setPage(nextPage);
              void store.loadItems({
                errorFallback: t("error"),
                targetPage: nextPage,
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
