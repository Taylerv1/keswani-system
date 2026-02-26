"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  CreditCard,
  FileText,
  Wrench,
  Building2,
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
  late_payment: <CreditCard size={16} />,
  contract_ending: <FileText size={16} />,
  maintenance: <Wrench size={16} />,
  vacant_property: <Building2 size={16} />,
};

const typeColors: Record<string, { bg: string; text: string }> = {
  late_payment: { bg: "bg-card-red-light", text: "text-card-red" },
  contract_ending: { bg: "bg-card-orange-light", text: "text-card-orange" },
  maintenance: { bg: "bg-card-blue-light", text: "text-card-blue" },
  vacant_property: { bg: "bg-card-green-light", text: "text-card-green" },
};

export default function NotificationsPage() {
  const { t, locale } = useTranslation();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");
  const [page, setPage] = useState(1);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchNotifications({
        section: "rent",
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
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = items.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await markNotificationReadApi(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsReadApi("rent");
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("notificationManagement")}</h1>
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
          <option value="all">{t("all")} - {t("notificationType")}</option>
          <option value="late_payment">{t("latePaymentNotif")}</option>
          <option value="contract_ending">{t("contractEndingNotif")}</option>
          <option value="maintenance">{t("maintenanceNotif")}</option>
          <option value="vacant_property">{t("vacantPropertyNotif")}</option>
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
              items.map((n) => {
                const colors = typeColors[n.type] ?? typeColors.maintenance;
                return (
                  <div
                    key={n.id}
                    className={`bg-surface rounded-xl border p-4 flex items-start gap-4 transition-all ${n.read
                        ? "border-surface-border"
                        : "border-primary/30 shadow-sm"
                      }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}
                    >
                      {typeIcons[n.type] ?? <Bell size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold text-text-primary">
                          {locale === "ar" ? n.titleAr : n.title}
                        </h3>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-text-secondary">
                        {locale === "ar" ? n.messageAr : n.message}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
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

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
