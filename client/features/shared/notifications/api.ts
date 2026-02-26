// ============================================================
// Unified Notification Module — API Layer (via Next.js /api proxy)
// ============================================================

// --------------- Types ---------------

export interface NotificationDto {
    id: string;
    recipient_type: "client" | "employee";
    recipient_id: string;
    channel: "email" | "whatsapp" | "in_app";
    subject: string;
    subjectAr?: string;
    body: string | null;
    bodyAr?: string | null;
    status: "pending" | "sent" | "failed";
    scheduled_at: string | null;
    sent_at: string | null;
    related_entity_type: string | null;
    related_entity_id: string | null;
    created_at: string;
    updated_at: string;
    type?: "rent" | "electricity";
    read?: boolean;
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
    type?: "rent" | "electricity" | "all";
}): Promise<ApiResponse<NotificationListResponse>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    if (params?.channel) query.set("channel", params.channel);
    if (params?.status) query.set("status", params.status);
    if (params?.related_entity_type) query.set("related_entity_type", params.related_entity_type);
    if (params?.type) query.set("type", params.type);
    const qs = query.toString();
    return fetchApi(`/api/notifications${qs ? `?${qs}` : ""}`);
}

export async function getNotificationById(id: string): Promise<ApiResponse<NotificationDto>> {
    return fetchApi(`/api/notifications/${id}`);
}

export async function markAllNotificationsRead(type?: "rent" | "electricity" | "all"): Promise<ApiResponse> {
    const query = type ? `?type=${type}` : "";
    return fetchApi(`/api/notifications/mark-all-read${query}`, { method: "PATCH" });
}

export async function updateNotification(
    id: string,
    data: { status?: string; subject?: string; body?: string; read?: boolean },
): Promise<ApiResponse<NotificationDto>> {
    // Map 'read' to 'status' for backend compatibility
    const backendData: { status?: string; subject?: string; body?: string } = {};
    if (data.subject !== undefined) backendData.subject = data.subject;
    if (data.body !== undefined) backendData.body = data.body;
    if (data.status !== undefined) backendData.status = data.status;
    if (data.read !== undefined) backendData.status = data.read ? "sent" : "pending";
    
    return fetchApi(`/api/notifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(backendData),
    });
}

export async function deleteNotification(id: string): Promise<ApiResponse> {
    return fetchApi(`/api/notifications/${id}`, { method: "DELETE" });
}
