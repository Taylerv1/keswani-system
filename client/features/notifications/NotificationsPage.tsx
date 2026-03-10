"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { autorun } from "mobx";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CreditCard,
  Eye,
  FileText,
  Gauge,
  Home,
  Wrench,
  Zap,
} from "lucide-react";
import { useTranslation } from "@/lib/translation";
import {
  LoadingLottie,
  Modal,
  Pagination,
  SearchBar,
  SelectMenu,
  StatusBadge,
} from "@/components/ui";
import { notificationsStore } from "./store";
import type { TabFilter, NotificationItem, MaintenanceDetail, IssueDetail } from "./types";

function useMobxRender() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const dispose = autorun(() => {
      void notificationsStore.observerSnapshot;
      setTick((prev) => prev + 1);
    });
    return () => dispose();
  }, []);
}

/* ── Icon + Color maps ─── */

const typeIcons: Record<string, React.ReactNode> = {
  unpaid_bill: <CreditCard size={16} />,
  unread_meter: <Gauge size={16} />,
  late_bill: <FileText size={16} />,
  high_consumption: <Zap size={16} />,
  faulty_meter: <AlertTriangle size={16} />,
  electricity_issue: <Wrench size={16} />,
  late_payment: <CreditCard size={16} />,
  contract_ending: <FileText size={16} />,
  maintenance: <Wrench size={16} />,
  vacant_property: <Home size={16} />,
};

const typeColors: Record<string, { bg: string; text: string }> = {
  unpaid_bill: { bg: "bg-card-red-light", text: "text-card-red" },
  unread_meter: { bg: "bg-card-orange-light", text: "text-card-orange" },
  late_bill: { bg: "bg-card-blue-light", text: "text-card-blue" },
  high_consumption: { bg: "bg-card-orange-light", text: "text-card-orange" },
  faulty_meter: { bg: "bg-card-red-light", text: "text-card-red" },
  electricity_issue: { bg: "bg-card-blue-light", text: "text-card-blue" },
  late_payment: { bg: "bg-card-red-light", text: "text-card-red" },
  contract_ending: { bg: "bg-card-orange-light", text: "text-card-orange" },
  maintenance: { bg: "bg-card-blue-light", text: "text-card-blue" },
  vacant_property: { bg: "bg-card-green-light", text: "text-card-green" },
};

const sectionBadge: Record<string, { bg: string; text: string; label: string }> = {
  rent: { bg: "bg-card-blue-light", text: "text-card-blue", label: "sectionRent" },
  electricity: { bg: "bg-card-orange-light", text: "text-card-orange", label: "sectionElectricity" },
};

const typeTranslationMap: Record<string, string> = {
  unpaid_bill: "unpaidBillAlert",
  unread_meter: "unreadMeterAlert",
  late_bill: "lateBillAlert",
  high_consumption: "highConsumptionAlert",
  faulty_meter: "faultyMeterAlert",
  electricity_issue: "electricityIssueAlert",
  late_payment: "latePaymentNotif",
  contract_ending: "contractEndingNotif",
  maintenance: "maintenanceNotif",
  vacant_property: "vacantPropertyNotif",
};

const rentTypeOptions = [
  { value: "late_payment", labelKey: "latePaymentNotif" },
  { value: "contract_ending", labelKey: "contractEndingNotif" },
  { value: "maintenance", labelKey: "maintenanceNotif" },
  { value: "vacant_property", labelKey: "vacantPropertyNotif" },
];

const electricityTypeOptions = [
  { value: "unpaid_bill", labelKey: "unpaidBillAlert" },
  { value: "unread_meter", labelKey: "unreadMeterAlert" },
  { value: "late_bill", labelKey: "lateBillAlert" },
  { value: "high_consumption", labelKey: "highConsumptionAlert" },
  { value: "faulty_meter", labelKey: "faultyMeterAlert" },
  { value: "electricity_issue", labelKey: "electricityIssueAlert" },
];

function getTypeOptions(tab: TabFilter) {
  if (tab === "rent") return rentTypeOptions;
  if (tab === "electricity") return electricityTypeOptions;
  return [...rentTypeOptions, ...electricityTypeOptions];
}

/* ── Entity detail helpers ─── */

function categoryKey(cat: string): string {
  const map: Record<string, string> = {
    billing: "issueCategoryBilling",
    meter: "issueCategoryMeter",
    connection: "issueCategoryConnection",
    other: "issueCategoryOther",
  };
  return map[cat] ?? cat;
}

/* ── Page Component ─── */

export default function NotificationsPage() {
  const { t, locale } = useTranslation();
  const store = notificationsStore;
  const searchParams = useSearchParams();
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  useMobxRender();

  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam === "rent" || tabParam === "electricity") {
      store.setTab(tabParam);
    }
    void store.bootstrap(t("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs: { key: TabFilter; labelKey: string; icon: React.ReactNode }[] = [
    { key: "all", labelKey: "allNotifications", icon: <Bell size={14} /> },
    { key: "rent", labelKey: "rent", icon: <Home size={14} /> },
    { key: "electricity", labelKey: "electricity", icon: <Zap size={14} /> },
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(locale === "ar" ? "ar-LB" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleView = (item: NotificationItem) => {
    setSelectedNotif(item);
    void store.loadEntityDetail(item);
    if (!item.read) {
      void store.markRead(item.id, { errorFallback: t("error") });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("notifications")}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {store.unreadCount} {t("unread")}
          </p>
        </div>
        {store.unreadCount > 0 && (
          <button
            onClick={() =>
              void store.markAllRead({
                errorFallback: t("error"),
                successMessage: t("allMarkedRead"),
              })
            }
            disabled={store.actionLoading}
            className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-primary hover:border-primary/40 transition-colors text-sm font-medium cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckCheck size={16} />
            {t("markAllRead")}
          </button>
        )}
      </div>

      {/* Flash messages */}
      {store.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {store.error}
        </div>
      )}
      {store.success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {store.success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-surface-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              store.setTab(tab.key);
              void store.loadNotifications({ errorFallback: t("error") });
            }}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer bg-transparent
              ${store.tab === tab.key
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar
            value={store.search}
            onChange={(value) => {
              store.setSearch(value);
              void store.loadNotifications({ errorFallback: t("error") });
            }}
          />
        </div>
        <div className="sm:w-48">
          <SelectMenu
            value={store.filterType}
            onChange={(value) => {
              store.setFilterType(value);
              void store.loadNotifications({ errorFallback: t("error") });
            }}
            options={[
              { value: "all", label: `${t("all")} - ${t("alertType")}` },
              ...getTypeOptions(store.tab).map((o) => ({
                value: o.value,
                label: t(o.labelKey),
              })),
            ]}
            placeholder={`${t("all")} - ${t("alertType")}`}
            noResultsLabel={t("noResults")}
          />
        </div>
        <div className="sm:w-40">
          <SelectMenu
            value={store.filterRead}
            onChange={(value) => {
              store.setFilterRead(value as typeof store.filterRead);
              void store.loadNotifications({ errorFallback: t("error") });
            }}
            options={[
              { value: "all", label: t("all") },
              { value: "unread", label: t("unread") },
              { value: "read", label: t("read") },
            ]}
            placeholder={t("all")}
            noResultsLabel={t("noResults")}
          />
        </div>
      </div>

      {/* Notification list */}
      {store.loading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : (
        <div className="space-y-3">
          {store.items.length === 0 ? (
            <div className="bg-surface rounded-xl border border-surface-border p-8 text-center text-text-muted">
              {store.filterRead === "unread" && store.totalItems === 0
                ? t("allRead")
                : t("noResults")}
            </div>
          ) : (
            store.items.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                t={t}
                formatDate={formatDate}
                onView={handleView}
              />
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={store.page}
        totalPages={store.totalPages}
        totalItems={store.totalItems}
        pageSize={store.PAGE_SIZE}
        onPageChange={(nextPage) => {
          store.setPage(nextPage);
          void store.loadNotifications({
            errorFallback: t("error"),
            targetPage: nextPage,
          });
        }}
      />

      {/* Detail Modal */}
      <NotificationDetailModal
        item={selectedNotif}
        t={t}
        formatDate={formatDate}
        onClose={() => setSelectedNotif(null)}
      />
    </div>
  );
}

/* ── Notification Card ─── */

function NotificationCard({
  item,
  t,
  formatDate,
  onView,
}: {
  item: NotificationItem;
  t: (key: string) => string;
  formatDate: (date: string) => string;
  onView: (item: NotificationItem) => void;
}) {
  const colors = typeColors[item.type] ?? { bg: "bg-card-blue-light", text: "text-card-blue" };
  const badge = sectionBadge[item.section];

  return (
    <div
      className={`bg-surface rounded-xl border p-3 sm:p-4 flex items-start gap-3 sm:gap-4 transition-all ${
        item.read
          ? "border-surface-border opacity-75"
          : "border-primary/30 bg-primary/5 shadow-sm"
      }`}
    >
      {/* Type icon */}
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}
      >
        {typeIcons[item.type] ?? <Bell size={16} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5">
          <h3 className={`text-xs sm:text-sm font-semibold ${item.read ? "text-text-secondary" : "text-text-primary"}`}>
            {item.title}
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
            {t(typeTranslationMap[item.type] ?? item.type)}
          </span>
          {badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.bg} ${badge.text}`}>
              {t(badge.label)}
            </span>
          )}
          {!item.read && (
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
          )}
        </div>
        <p className={`text-xs sm:text-sm ${item.read ? "text-text-muted" : "text-text-secondary"}`}>
          {item.message}
        </p>
        <p className="text-xs text-text-muted mt-1">{formatDate(item.createdAt)}</p>
      </div>

      {/* View button */}
      <button
        onClick={() => onView(item)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer bg-transparent border-0 shrink-0"
        title={t("view")}
      >
        <Eye size={16} />
      </button>
    </div>
  );
}

/* ── Notification Detail Modal ─── */

function NotificationDetailModal({
  item,
  t,
  formatDate,
  onClose,
}: {
  item: NotificationItem | null;
  t: (key: string) => string;
  formatDate: (date: string) => string;
  onClose: () => void;
}) {
  const store = notificationsStore;
  const loading = store.entityLoading;
  const entityDetail = store.entityDetail;

  const isIssueDetail = (d: MaintenanceDetail | IssueDetail): d is IssueDetail =>
    "category" in d;

  const modalTitle =
    item?.section === "electricity"
      ? t("viewIssue")
      : item?.section === "rent"
        ? t("maintenanceDetails")
        : t("notificationDetails");

  return (
    <Modal open={Boolean(item)} onClose={onClose} title={modalTitle} maxWidth="max-w-xl">
      {item && (
        <div className="space-y-4">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <LoadingLottie size={240} zoom={1} />
            </div>
          )}

          {/* Electricity Issue Detail */}
          {!loading && entityDetail && isIssueDetail(entityDetail) && (
            <EntityElectricityView data={entityDetail} t={t} formatDate={formatDate} />
          )}

          {/* Maintenance Detail */}
          {!loading && entityDetail && !isIssueDetail(entityDetail) && (
            <EntityMaintenanceView data={entityDetail} t={t} formatDate={formatDate} />
          )}

          {/* Fallback: no relatedId or fetch returned null */}
          {!loading && !entityDetail && (
            <NotificationFallbackView item={item} t={t} formatDate={formatDate} />
          )}

          {/* Close */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:border-primary/40 hover:text-primary transition-colors"
            >
              {t("close")}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ── Electricity Issue Detail View ─── */

function EntityElectricityView({
  data,
  t,
  formatDate,
}: {
  data: IssueDetail;
  t: (key: string) => string;
  formatDate: (date: string) => string;
}) {
  return (
    <>
      <div>
        <h3 className="text-lg font-semibold text-text-primary">{data.title}</h3>
        <p className="text-sm text-text-secondary mt-1">{data.description || "-"}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-background rounded-lg p-3">
          <p className="text-xs text-text-muted">{t("issueStatus")}</p>
          <div className="mt-1"><StatusBadge status={data.status} /></div>
        </div>
        <div className="bg-background rounded-lg p-3">
          <p className="text-xs text-text-muted">{t("issuePriority")}</p>
          <div className="mt-1"><StatusBadge status={data.priority} /></div>
        </div>
        <div className="bg-background rounded-lg p-3">
          <p className="text-xs text-text-muted">{t("issueCategory")}</p>
          <p className="text-sm font-medium text-text-primary">
            {t(categoryKey(data.category))}
          </p>
        </div>
        <div className="bg-background rounded-lg p-3">
          <p className="text-xs text-text-muted">{t("subscriber")}</p>
          <p className="text-sm font-medium text-text-primary">{data.client_name || "-"}</p>
          {data.subscription_number && (
            <p className="text-xs text-text-muted">{data.subscription_number}</p>
          )}
        </div>
        {data.property_name && (
          <div className="bg-background rounded-lg p-3">
            <p className="text-xs text-text-muted">{t("property")}</p>
            <p className="text-sm font-medium text-text-primary">
              {data.property_name}
              {data.unit_number ? ` - ${data.unit_number}` : ""}
            </p>
          </div>
        )}
        <div className="bg-background rounded-lg p-3">
          <p className="text-xs text-text-muted">{t("assignedTo")}</p>
          <p className="text-sm font-medium text-text-primary">
            {data.assignee_name || t("unassigned")}
          </p>
        </div>
        <div className="bg-background rounded-lg p-3">
          <p className="text-xs text-text-muted">{t("createdAt")}</p>
          <p className="text-sm font-medium text-text-primary">{formatDate(data.created_at)}</p>
        </div>
        {data.resolved_at && (
          <div className="bg-background rounded-lg p-3">
            <p className="text-xs text-text-muted">{t("resolvedAt")}</p>
            <p className="text-sm font-medium text-text-primary">
              {formatDate(data.resolved_at)}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Maintenance Detail View ─── */

function EntityMaintenanceView({
  data,
  t,
  formatDate,
}: {
  data: MaintenanceDetail;
  t: (key: string) => string;
  formatDate: (date: string) => string;
}) {
  return (
    <>
      <div>
        <h3 className="text-lg font-semibold text-text-primary">{data.title}</h3>
        <p className="text-sm text-text-secondary mt-1">{data.description || "-"}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-background rounded-lg p-3">
          <p className="text-xs text-text-muted">{t("status")}</p>
          <div className="mt-1"><StatusBadge status={data.status} /></div>
        </div>
        <div className="bg-background rounded-lg p-3">
          <p className="text-xs text-text-muted">{t("priority")}</p>
          <div className="mt-1"><StatusBadge status={data.priority} /></div>
        </div>
        {data.property_name && (
          <div className="bg-background rounded-lg p-3">
            <p className="text-xs text-text-muted">{t("property")}</p>
            <p className="text-sm font-medium text-text-primary">
              {data.property_name}
              {data.unit_number ? ` - ${data.unit_number}` : ""}
            </p>
          </div>
        )}
        <div className="bg-background rounded-lg p-3">
          <p className="text-xs text-text-muted">{t("tenant")}</p>
          <p className="text-sm font-medium text-text-primary">
            {data.requester_name || "-"}
          </p>
        </div>
        <div className="bg-background rounded-lg p-3">
          <p className="text-xs text-text-muted">{t("assignedTo")}</p>
          <p className="text-sm font-medium text-text-primary">
            {data.assignee_name || t("unassigned")}
          </p>
        </div>
        {data.estimated_cost !== null && data.estimated_cost !== undefined && (
          <div className="bg-background rounded-lg p-3">
            <p className="text-xs text-text-muted">{t("maintenanceCost")}</p>
            <p className="text-sm font-medium text-text-primary">
              ${Number(data.estimated_cost).toFixed(2)}
            </p>
          </div>
        )}
        <div className="bg-background rounded-lg p-3">
          <p className="text-xs text-text-muted">{t("createdAt")}</p>
          <p className="text-sm font-medium text-text-primary">{formatDate(data.created_at)}</p>
        </div>
        <div className="bg-background rounded-lg p-3">
          <p className="text-xs text-text-muted">{t("updatedAt")}</p>
          <p className="text-sm font-medium text-text-primary">{formatDate(data.updated_at)}</p>
        </div>
      </div>
    </>
  );
}

/* ── Fallback View (no relatedId or fetch failed) ─── */

function NotificationFallbackView({
  item,
  t,
  formatDate,
}: {
  item: NotificationItem;
  t: (key: string) => string;
  formatDate: (date: string) => string;
}) {
  const colors = typeColors[item.type] ?? { bg: "bg-card-blue-light", text: "text-card-blue" };
  const badge = sectionBadge[item.section];

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}>
          {typeIcons[item.type] ?? <Bell size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-text-primary">{item.title}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
              {t(typeTranslationMap[item.type] ?? item.type)}
            </span>
            {badge && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.bg} ${badge.text}`}>
                {t(badge.label)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-background rounded-lg p-3">
        <p className="text-xs text-text-muted mb-1">{t("message")}</p>
        <p className="text-sm text-text-secondary">{item.message}</p>
      </div>

      <div className="bg-background rounded-lg p-3">
        <p className="text-xs text-text-muted mb-1">{t("createdAt")}</p>
        <p className="text-sm font-medium text-text-primary">{formatDate(item.createdAt)}</p>
      </div>
    </div>
  );
}
