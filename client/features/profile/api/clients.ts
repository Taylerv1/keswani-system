// ============================================================
// Keswani System — Frontend Clients API Helpers
// ============================================================

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api";

// -------------------------------------------
// Types
// -------------------------------------------
interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}

interface ActiveContract {
    id: string;
    property_id: string;
    property_name: string;
    unit_id: string;
    unit_number: string;
    monthly_rent: number;
    currency: string;
    start_date: string;
    end_date: string | null;
    status: string;
}

interface Client {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    active_contract: ActiveContract | null;
    created_at: string;
    updated_at: string;
}

interface CreateClientInput {
    full_name: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
}

interface UpdateClientInput {
    full_name?: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
}

// -------------------------------------------
// Helper
// -------------------------------------------
async function fetchApi<T>(endpoint: string, token: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
        ...options,
    });
    const data: ApiResponse<T> = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
    return data;
}

// -------------------------------------------
// API Functions
// -------------------------------------------

export async function getClients(
    token: string,
    params?: { page?: number; limit?: number; search?: string }
): Promise<ApiResponse<PaginatedResponse<Client>>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    return fetchApi(`/clients?${query}`, token);
}

export async function getClientById(token: string, id: string): Promise<ApiResponse<Client>> {
    return fetchApi(`/clients/${id}`, token);
}

export async function createClient(token: string, data: CreateClientInput): Promise<ApiResponse<Client>> {
    return fetchApi("/clients", token, { method: "POST", body: JSON.stringify(data) });
}

export async function updateClient(token: string, id: string, data: UpdateClientInput): Promise<ApiResponse<Client>> {
    return fetchApi(`/clients/${id}`, token, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteClient(token: string, id: string): Promise<ApiResponse> {
    return fetchApi(`/clients/${id}`, token, { method: "DELETE" });
}
