// ============================================================
// Notification Module — API Layer (via Next.js /api proxy)
// ============================================================

// --------------- Types ---------------

export interface NotificationDto {
    id: string;
    recipient_type: "client" | "employee";
    recipient_id: string;
    channel: "email" | "whatsapp" | "in_app";
    subject: string;
    body: string | null;
    status: "pending" | "sent" | "failed";
    scheduled_at: string | null;
    sent_at: string | null;
    related_entity_type: string | null;
    related_entity_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface NotificationListResponse {
    items: NotificationDto[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
    unread_count: number;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// --------------- Fetch helper ---------------

async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<ApiResponse<T>> {
    const res = await fetch(endpoint, {
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
    });
    const data: ApiResponse<T> = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.error || `Request failed: ${res.status}`);
    }
    return data;
}

// --------------- CRUD ---------------

export async function getNotifications(params?: {
    page?: number;
    limit?: number;
    search?: string;
    channel?: string;
    status?: string;
    related_entity_type?: string;
}): Promise<ApiResponse<NotificationListResponse>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    if (params?.channel) query.set("channel", params.channel);
    if (params?.status) query.set("status", params.status);
    if (params?.related_entity_type) query.set("related_entity_type", params.related_entity_type);
    const qs = query.toString();
    return fetchApi(`/api/rent/notifications${qs ? `?${qs}` : ""}`);
}

export async function getNotificationById(id: string): Promise<ApiResponse<NotificationDto>> {
    return fetchApi(`/api/rent/notifications/${id}`);
}

export async function markAllNotificationsRead(): Promise<ApiResponse> {
    return fetchApi("/api/rent/notifications/mark-all-read", { method: "PATCH" });
}

export async function updateNotification(
    id: string,
    data: { status?: string; subject?: string; body?: string },
): Promise<ApiResponse<NotificationDto>> {
    return fetchApi(`/api/rent/notifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function deleteNotification(id: string): Promise<ApiResponse> {
    return fetchApi(`/api/rent/notifications/${id}`, { method: "DELETE" });
}
