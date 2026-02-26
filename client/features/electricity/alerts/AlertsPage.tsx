"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  CreditCard,
  Gauge,
  Zap,
  FileText,
  CheckCheck,
  Check,
} from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { SearchBar, Pagination, LoadingLottie } from "@/components/ui";
import {
  fetchNotifications,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  type NotificationItem,
} from "@/features/rent/api/notifications";

const PAGE_SIZE = 8;

const typeIcons: Record<string, React.ReactNode> = {
  unpaid_bill: <CreditCard size={16} />,
  unread_meter: <Gauge size={16} />,
  late_bill: <FileText size={16} />,
  high_consumption: <Zap size={16} />,
  faulty_meter: <AlertTriangle size={16} />,
};

const typeColors: Record<string, { bg: string; text: string }> = {
  unpaid_bill: { bg: "bg-card-red-light", text: "text-card-red" },
  unread_meter: { bg: "bg-card-orange-light", text: "text-card-orange" },
  late_bill: { bg: "bg-card-blue-light", text: "text-card-blue" },
  high_consumption: { bg: "bg-card-orange-light", text: "text-card-orange" },
  faulty_meter: { bg: "bg-card-red-light", text: "text-card-red" },
};

const typeTranslationMap: Record<string, string> = {
  unpaid_bill: "unpaidBillAlert",
  unread_meter: "unreadMeterAlert",
  late_bill: "lateBillAlert",
  high_consumption: "highConsumptionAlert",
  faulty_meter: "faultyMeterAlert",
};

export default function AlertsPage() {
  const { t, locale } = useTranslation();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");
  const [page, setPage] = useState(1);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchNotifications({
        section: "electricity",
        type: filterType !== "all" ? filterType : undefined,
        is_read: filterRead === "unread" ? "false" : filterRead === "read" ? "true" : undefined,
        search: search || undefined,
        page,
        limit: PAGE_SIZE,
      });
      if (res.success && res.data) {
        setItems(res.data.items);
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.total_pages);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filterType, filterRead, search, page]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const unreadCount = items.filter((a) => !a.read).length;

  const handleMarkRead = async (id: string) => {
    await markNotificationReadApi(id);
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsReadApi("electricity");
    setItems((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("alertsManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {unreadCount} {t("unread")}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-primary hover:border-primary/40 transition-colors text-sm font-medium cursor-pointer flex items-center gap-2"
          >
            <CheckCheck size={16} />
            {t("markAllRead")}
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">{t("all")} - {t("alertType")}</option>
          <option value="unpaid_bill">{t("unpaidBillAlert")}</option>
          <option value="unread_meter">{t("unreadMeterAlert")}</option>
          <option value="late_bill">{t("lateBillAlert")}</option>
          <option value="high_consumption">{t("highConsumptionAlert")}</option>
          <option value="faulty_meter">{t("faultyMeterAlert")}</option>
        </select>
        <select
          value={filterRead}
          onChange={(e) => { setFilterRead(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">{t("all")}</option>
          <option value="unread">{t("unread")}</option>
          <option value="read">{t("read")}</option>
        </select>
      </div>

      {loading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <LoadingLottie size={80} className="p-4" />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="bg-surface rounded-xl border border-surface-border p-8 text-center text-text-muted">
                {t("noResults")}
              </div>
            ) : (
              items.map((a) => {
                const colors = typeColors[a.type] ?? typeColors.unpaid_bill;
                return (
                  <div
                    key={a.id}
                    className={`bg-surface rounded-xl border p-3 sm:p-4 flex items-start gap-3 sm:gap-4 transition-all ${
                      a.read ? "border-surface-border" : "border-primary/30 shadow-sm"
                    }`}
                  >
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}>
                      {typeIcons[a.type] ?? <AlertTriangle size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5">
                        <h3 className="text-xs sm:text-sm font-semibold text-text-primary">
                          {locale === "ar" ? a.titleAr : a.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                          {t(typeTranslationMap[a.type] ?? a.type)}
                        </span>
                        {!a.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs sm:text-sm text-text-secondary">
                        {locale === "ar" ? a.messageAr : a.message}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!a.read && (
                      <button
                        onClick={() => handleMarkRead(a.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-green hover:bg-card-green-light transition-colors cursor-pointer bg-transparent border-0 shrink-0"
                        title={t("markAsRead")}
                      >
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <Pagination currentPage={page} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
