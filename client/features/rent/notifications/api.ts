import { fetchApi } from "@/features/rent/properties/api";

// ─── Types ───────────────────────────────────────────────
export type NotificationChannel = "email" | "whatsapp" | "in_app";
export type NotificationStatus = "pending" | "sent" | "failed";

export interface NotificationItem {
    id: string;
    recipient_type: string;
    recipient_id: string;
    channel: NotificationChannel;
    subject: string | null;
    body: string | null;
    status: NotificationStatus;
    scheduled_at: string | null;
    sent_at: string | null;
    related_entity_type: string | null;
    related_entity_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface NotificationListResponse {
    success: boolean;
    data: {
        items: NotificationItem[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
        unread_count: number;
    };
}

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// ─── API Functions ───────────────────────────────────────

export async function getNotifications(params?: {
    page?: number;
    limit?: number;
    search?: string;
    channel?: NotificationChannel;
    status?: NotificationStatus;
    related_entity_type?: string;
}): Promise<NotificationListResponse> {
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

export async function getNotificationById(
    id: string,
): Promise<ApiResponse<NotificationItem>> {
    return fetchApi(`/api/rent/notifications/${id}`);
}

export async function createNotification(data: {
    recipient_type: "client" | "employee";
    recipient_id: string;
    channel?: NotificationChannel;
    subject: string;
    body?: string;
    related_entity_type?: string;
    related_entity_id?: string;
}): Promise<ApiResponse<NotificationItem>> {
    return fetchApi("/api/rent/notifications", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateNotification(
    id: string,
    data: {
        subject?: string;
        body?: string;
        status?: NotificationStatus;
    },
): Promise<ApiResponse<NotificationItem>> {
    return fetchApi(`/api/rent/notifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function markAllNotificationsRead(): Promise<ApiResponse> {
    return fetchApi("/api/rent/notifications/mark-all-read", {
        method: "PATCH",
    });
}

export async function deleteNotification(
    id: string,
): Promise<ApiResponse> {
    return fetchApi(`/api/rent/notifications/${id}`, {
        method: "DELETE",
    });
}
