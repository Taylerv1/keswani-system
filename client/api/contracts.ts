// ============================================================
// Keswani System — Frontend Contracts API Helpers
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

interface Contract {
    id: string;
    unit_id: string;
    unit_number: string;
    property_id: string;
    property_name: string;
    client_id: string;
    client_name: string;
    start_date: string;
    end_date: string | null;
    monthly_rent: number;
    currency: string;
    deposit_amount: number;
    status: "pending" | "active" | "expired" | "terminated";
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface CreateContractInput {
    unit_id: string;
    client_id: string;
    start_date: string;
    end_date?: string;
    monthly_rent: number;
    deposit_amount?: number;
    currency?: string;
    status?: "pending" | "active" | "expired" | "terminated";
    notes?: string;
}

interface UpdateContractInput {
    unit_id?: string;
    client_id?: string;
    start_date?: string;
    end_date?: string | null;
    monthly_rent?: number;
    deposit_amount?: number;
    currency?: string;
    status?: "pending" | "active" | "expired" | "terminated";
    notes?: string | null;
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

export async function getContracts(
    token: string,
    params?: { page?: number; limit?: number; search?: string; status?: string }
): Promise<ApiResponse<PaginatedResponse<Contract>>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    return fetchApi(`/contracts?${query}`, token);
}

export async function getContractById(token: string, id: string): Promise<ApiResponse<Contract>> {
    return fetchApi(`/contracts/${id}`, token);
}

export async function createContract(token: string, data: CreateContractInput): Promise<ApiResponse<Contract>> {
    return fetchApi("/contracts", token, { method: "POST", body: JSON.stringify(data) });
}

export async function updateContract(token: string, id: string, data: UpdateContractInput): Promise<ApiResponse<Contract>> {
    return fetchApi(`/contracts/${id}`, token, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteContract(token: string, id: string): Promise<ApiResponse> {
    return fetchApi(`/contracts/${id}`, token, { method: "DELETE" });
}
