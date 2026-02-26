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
  Trash2,
  Send,
  Filter,
  Search,
} from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { Pagination, LoadingLottie } from "@/components/ui";
import {
  getNotifications,
  markAllNotificationsRead,
  updateNotification,
  deleteNotification,
  type NotificationItem,
  type NotificationStatus,
  type NotificationChannel,
} from "./api";

const PAGE_SIZE = 10;

const typeIcons: Record<string, React.ReactNode> = {
  contract: <FileText size={16} />,
  payment: <CreditCard size={16} />,
  maintenance: <Wrench size={16} />,
  property: <Building2 size={16} />,
};

const typeColors: Record<string, { bg: string; text: string }> = {
  contract: { bg: "bg-card-blue-light", text: "text-card-blue" },
  payment: { bg: "bg-card-green-light", text: "text-card-green" },
  maintenance: { bg: "bg-card-orange-light", text: "text-card-orange" },
  property: { bg: "bg-card-red-light", text: "text-card-red" },
};

const statusColors: Record<NotificationStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-600", label: "Unread" },
  sent: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Read" },
  failed: { bg: "bg-red-50", text: "text-red-600", label: "Failed" },
};

const channelLabels: Record<NotificationChannel, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  in_app: "In-App",
};

export default function NotificationsPage() {
  const { t } = useTranslation();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterChannel, setFilterChannel] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getNotifications({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: filterStatus !== "all" ? (filterStatus as NotificationStatus) : undefined,
        channel: filterChannel !== "all" ? (filterChannel as NotificationChannel) : undefined,
      });
      if (res.success && res.data) {
        setItems(res.data.items);
        setTotalPages(res.data.pagination.total_pages);
        setTotalItems(res.data.pagination.total);
        setUnreadCount(res.data.unread_count);
      } else {
        setError("Failed to load notifications");
      }
    } catch {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterChannel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      fetchData();
    } catch {
      /* ignore */
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await updateNotification(id, { status: "sent" });
      fetchData();
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      fetchData();
    } catch {
      /* ignore */
    }
  };

  const getEntityIcon = (type: string | null) => {
    if (!type) return <Bell size={16} />;
    const key = type.toLowerCase();
    return typeIcons[key] ?? <Bell size={16} />;
  };

  const getEntityColors = (type: string | null) => {
    if (!type) return typeColors.maintenance;
    const key = type.toLowerCase();
    return typeColors[key] ?? typeColors.maintenance;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
            {t("notificationManagement")}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                {unreadCount > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${unreadCount > 0 ? "bg-primary" : "bg-text-muted"}`} />
              </span>
              {unreadCount} {t("unread")}
            </span>
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="h-10 px-4 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all text-sm font-medium cursor-pointer flex items-center gap-2 border-0"
          >
            <CheckCheck size={16} />
            {t("markAllRead")}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder") || "Search notifications..."}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-surface-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary pl-8 pr-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
            >
              <option value="all">{t("all")} — Status</option>
              <option value="pending">{t("unread")}</option>
              <option value="sent">{t("read")}</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <select
            value={filterChannel}
            onChange={(e) => {
              setFilterChannel(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">{t("all")} — Channel</option>
            <option value="in_app">In-App</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="min-h-[40vh] flex items-center justify-center">
          <LoadingLottie size={100} className="p-4" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-card-red-light border border-card-red/20 rounded-xl p-6 text-center">
          <p className="text-card-red text-sm">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div className="bg-surface rounded-xl border border-surface-border p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center mx-auto mb-4">
            <Bell size={24} className="text-text-muted" />
          </div>
          <p className="text-text-muted text-sm font-medium">{t("noResults")}</p>
          <p className="text-text-muted text-xs mt-1">No notifications match your filters</p>
        </div>
      )}

      {/* Items */}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-2.5">
          {items.map((n) => {
            const colors = getEntityColors(n.related_entity_type);
            const statusConfig = statusColors[n.status];
            const isUnread = n.status === "pending";
            const timeStr = new Date(n.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={n.id}
                className={`group bg-surface rounded-xl border p-4 flex items-start gap-4 transition-all ${isUnread
                  ? "border-primary/25 shadow-sm shadow-primary/5"
                  : "border-surface-border hover:border-surface-border/80"
                  }`}
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}
                >
                  {getEntityIcon(n.related_entity_type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className={`text-sm font-semibold text-text-primary truncate ${isUnread ? "" : "font-medium"}`}>
                      {n.subject ?? "Notification"}
                    </h3>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />
                    )}
                  </div>
                  {n.body && (
                    <p className="text-sm text-text-secondary line-clamp-2">{n.body}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-text-muted">{timeStr}</span>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                      {statusConfig.label}
                    </span>
                    <span className="text-[10px] font-medium text-text-muted bg-background px-2 py-0.5 rounded-full">
                      {channelLabels[n.channel]}
                    </span>
                    {n.related_entity_type && (
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                        {n.related_entity_type}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUnread && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-green hover:bg-card-green-light transition-colors cursor-pointer bg-transparent border-0"
                      title={t("markAsRead")}
                    >
                      <Check size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
