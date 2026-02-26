"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Bell,
    BellOff,
    CheckCheck,
    Mail,
    MessageCircle,
    Monitor,
    Search,
    RefreshCw,
    AlertCircle,
    Filter,
    Home,
    Zap,
} from "lucide-react";
import { useTranslation } from "@/lib/translation";
import LoadingLottie from "@/components/ui/LoadingLottie";
import {
    getNotifications,
    markAllNotificationsRead,
    updateNotification,
    type NotificationDto,
    type NotificationListResponse,
} from "./api";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function channelIcon(ch: NotificationDto["channel"]) {
    switch (ch) {
        case "email": return <Mail size={14} />;
        case "whatsapp": return <MessageCircle size={14} />;
        case "in_app": return <Monitor size={14} />;
    }
}

function typeIcon(type: NotificationDto["type"]) {
    switch (type) {
        case "rent": return <Home size={14} />;
        case "electricity": return <Zap size={14} />;
        default: return <Bell size={14} />;
    }
}

function statusColor(s: NotificationDto["status"]) {
    switch (s) {
        case "pending": return "bg-amber-500/15 text-amber-600";
        case "sent": return "bg-emerald-500/15 text-emerald-600";
        case "failed": return "bg-red-500/15 text-red-600";
    }
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function UnifiedNotificationsPage() {
    const { t, locale } = useTranslation();

    // Data
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });
    const [unreadCount, setUnreadCount] = useState(0);

    // Filters
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterChannel, setFilterChannel] = useState<string>("all");
    const [filterType, setFilterType] = useState<string>("all");

    // UI state
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ---- Fetch ----
    const fetchData = useCallback(
        async (page = 1) => {
            try {
                setError(null);
                const res = await getNotifications({
                    page,
                    limit: 20,
                    search: search || undefined,
                    status: filterStatus !== "all" ? filterStatus : undefined,
                    channel: filterChannel !== "all" ? filterChannel : undefined,
                    type: filterType !== "all" ? (filterType as "rent" | "electricity") : undefined,
                });
                if (res.success && res.data) {
                    const d = res.data as NotificationListResponse;
                    setNotifications(d.items);
                    setPagination(d.pagination);
                    setUnreadCount(d.unread_count);
                }
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load notifications");
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [search, filterStatus, filterChannel, filterType],
    );

    useEffect(() => {
        setLoading(true);
        fetchData(1);
    }, [fetchData]);

    // ---- Actions ----
    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead(filterType !== "all" ? (filterType as "rent" | "electricity") : undefined);
            fetchData(pagination.page);
        } catch { /* silently ignore */ }
    };

    const handleMarkRead = async (id: string) => {
        try {
            await updateNotification(id, { read: true });
            fetchData(pagination.page);
        } catch { /* silently ignore */ }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData(pagination.page);
    };

    // ---- Render ----
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <LoadingLottie size={80} zoom={2} />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col gap-5 p-6 max-w-4xl" id="notifications">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Bell size={22} className="text-primary" />
                    <h1 className="text-xl font-bold text-text-primary">{t("notifications")}</h1>
                    {unreadCount > 0 && (
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-semibold">
                            {unreadCount}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-background transition-all cursor-pointer"
                    >
                        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                        {t("refresh") || "Refresh"}
                    </button>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                        >
                            <CheckCheck size={14} />
                            {t("markAllRead") || "Mark all read"}
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("search") || "Search notifications..."}
                        className="w-full ps-9 pe-3 py-2 rounded-lg bg-background border border-surface-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                </div>

                <div className="flex items-center gap-1.5">
                    <Filter size={14} className="text-text-muted" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-2.5 py-2 rounded-lg bg-background border border-surface-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                    >
                        <option value="all">{t("allStatuses") || "All statuses"}</option>
                        <option value="pending">{t("pending") || "Pending"}</option>
                        <option value="sent">{t("sent") || "Sent"}</option>
                        <option value="failed">{t("failed") || "Failed"}</option>
                    </select>
                </div>

                <select
                    value={filterChannel}
                    onChange={(e) => setFilterChannel(e.target.value)}
                    className="px-2.5 py-2 rounded-lg bg-background border border-surface-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                    <option value="all">{t("allChannels") || "All channels"}</option>
                    <option value="in_app">In-App</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                </select>

                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-2.5 py-2 rounded-lg bg-background border border-surface-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                    <option value="all">{t("allTypes") || "All types"}</option>
                    <option value="rent">{t("rent") || "Rent"}</option>
                    <option value="electricity">{t("electricity") || "Electricity"}</option>
                </select>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-600 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* List */}
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-3">
                    <BellOff size={40} />
                    <p className="text-sm">{t("noNotifications") || "No notifications found"}</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${n.status === "pending"
                                    ? "bg-primary/[0.03] border-primary/20"
                                    : "bg-surface border-surface-border"
                                }`}
                        >
                            {/* type icon */}
                            <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-background flex items-center justify-center text-text-muted">
                                {typeIcon(n.type)}
                            </div>

                            {/* content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className={`text-sm leading-snug ${n.status === "pending" ? "font-semibold text-text-primary" : "text-text-secondary"}`}>
                                        {locale === "ar" ? n.subjectAr : n.subject}
                                    </p>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${statusColor(n.status)}`}>
                                        {n.status}
                                    </span>
                                </div>

                                {(locale === "ar" ? n.bodyAr : n.body) && (
                                    <p className="text-xs text-text-muted line-clamp-2 mt-0.5">
                                        {locale === "ar" ? n.bodyAr : n.body}
                                    </p>
                                )}

                                <p className="text-[11px] text-text-muted mt-1.5">{timeAgo(n.created_at)}</p>
                            </div>

                            {/* channel icon */}
                            <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-background flex items-center justify-center text-text-muted">
                                {channelIcon(n.channel)}
                            </div>

                            {/* mark read */}
                            {n.status === "pending" && (
                                <button
                                    onClick={() => handleMarkRead(n.id)}
                                    title="Mark as read"
                                    className="shrink-0 mt-1 p-1.5 rounded-lg hover:bg-background text-text-muted hover:text-primary transition-all cursor-pointer"
                                >
                                    <CheckCheck size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.total_pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => { setLoading(true); fetchData(p); }}
                            className={`w-8 h-8 rounded-lg text-sm transition-all cursor-pointer ${p === pagination.page
                                    ? "bg-primary text-white font-semibold"
                                    : "text-text-secondary hover:bg-background"
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
