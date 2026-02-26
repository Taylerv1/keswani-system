// ============================================================
// Keswani System — Frontend Notification API Helpers
// ============================================================

interface NotificationItem {
    id: string;
    type: string;
    section: string;
    title: string;
    titleAr: string;
    message: string;
    messageAr: string;
    relatedId: string | null;
    relatedType: string | null;
    read: boolean;
    createdAt: string;
}

interface PaginatedResponse {
    items: NotificationItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export type { NotificationItem };

export async function fetchNotifications(params: {
    section?: string;
    type?: string;
    is_read?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<ApiResponse<PaginatedResponse>> {
    const query = new URLSearchParams();
    if (params.section) query.set("section", params.section);
    if (params.type) query.set("type", params.type);
    if (params.is_read) query.set("is_read", params.is_read);
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const res = await fetch(`/api/notifications${qs ? `?${qs}` : ""}`, {
        method: "GET",
        cache: "no-store",
    });
    return res.json();
}

export async function markNotificationReadApi(id: string): Promise<ApiResponse> {
    const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
    });
    return res.json();
}

export async function markAllNotificationsReadApi(
    section?: string
): Promise<ApiResponse> {
    const query = section ? `?section=${section}` : "";
    const res = await fetch(`/api/notifications/read-all${query}`, {
        method: "PATCH",
    });
    return res.json();
}

export async function fetchNotificationStats(): Promise<
    ApiResponse<{
        rent_unread: number;
        electricity_unread: number;
        total_unread: number;
    }>
> {
    const res = await fetch("/api/notifications/stats", {
        method: "GET",
        cache: "no-store",
    });
    return res.json();
}
