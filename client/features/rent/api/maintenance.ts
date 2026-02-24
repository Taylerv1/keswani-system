// ============================================================
// Keswani System — Frontend Maintenance API Helpers
// ============================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

interface PaginatedResponse<T> {
    items: T[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
}

interface MaintenanceRequest {
    id: string;
    unit_id: string;
    unit_number: string;
    property_id: string;
    property_name: string;
    requested_by: string | null;
    requester_name: string | null;
    assigned_to: string | null;
    assignee_name: string | null;
    title: string;
    description: string | null;
    status: "pending" | "in_progress" | "completed" | "cancelled";
    priority: "low" | "medium" | "high" | "urgent" | "critical";
    estimated_cost: number | null;
    actual_cost: number | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

interface CreateMaintenanceInput {
    unit_id: string;
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high" | "urgent" | "critical";
    requested_by?: string;
    assigned_to?: string;
    estimated_cost?: number;
}

interface UpdateMaintenanceInput {
    unit_id?: string;
    title?: string;
    description?: string | null;
    priority?: "low" | "medium" | "high" | "urgent" | "critical";
    status?: "pending" | "in_progress" | "completed" | "cancelled";
    requested_by?: string | null;
    assigned_to?: string | null;
    estimated_cost?: number | null;
    actual_cost?: number | null;
}

async function fetchApi<T>(endpoint: string, token: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
        ...options,
    });
    const data: ApiResponse<T> = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
    return data;
}

export async function getMaintenanceRequests(
    token: string,
    params?: { page?: number; limit?: number; search?: string; status?: string; priority?: string }
): Promise<ApiResponse<PaginatedResponse<MaintenanceRequest>>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    if (params?.priority) query.set("priority", params.priority);
    return fetchApi(`/maintenance?${query}`, token);
}

export async function getMaintenanceById(token: string, id: string): Promise<ApiResponse<MaintenanceRequest>> {
    return fetchApi(`/maintenance/${id}`, token);
}

export async function createMaintenance(token: string, data: CreateMaintenanceInput): Promise<ApiResponse<MaintenanceRequest>> {
    return fetchApi("/maintenance", token, { method: "POST", body: JSON.stringify(data) });
}

export async function updateMaintenance(token: string, id: string, data: UpdateMaintenanceInput): Promise<ApiResponse<MaintenanceRequest>> {
    return fetchApi(`/maintenance/${id}`, token, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteMaintenance(token: string, id: string): Promise<ApiResponse> {
    return fetchApi(`/maintenance/${id}`, token, { method: "DELETE" });
}
