// ============================================================
// Keswani System — Frontend Payments API Helpers
// ============================================================

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api";

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

interface PaymentSummary {
    total_income: number;
    total_collected: number;
    total_outstanding: number;
}

interface PaginatedPaymentResponse<T> {
    items: T[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
    summary: PaymentSummary;
}

interface RentPayment {
    id: string;
    contract_id: string;
    client_id: string;
    client_name: string;
    property_name: string;
    unit_number: string;
    amount: number;
    currency: string;
    payment_date: string;
    period_start: string | null;
    period_end: string | null;
    status: "pending" | "paid" | "partial" | "overdue" | "cancelled";
    received_by: string | null;
    receiver_name: string | null;
    receipt_number: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface CreatePaymentInput {
    contract_id: string;
    amount: number;
    payment_date: string;
    period_start?: string;
    period_end?: string;
    status?: "pending" | "paid" | "partial" | "overdue" | "cancelled";
    receipt_number?: string;
    currency?: string;
    notes?: string;
}

interface UpdatePaymentInput {
    amount?: number;
    payment_date?: string;
    period_start?: string | null;
    period_end?: string | null;
    status?: "pending" | "paid" | "partial" | "overdue" | "cancelled";
    receipt_number?: string | null;
    currency?: string;
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

export async function getPayments(
    token: string,
    params?: { page?: number; limit?: number; search?: string; status?: string }
): Promise<ApiResponse<PaginatedPaymentResponse<RentPayment>>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    return fetchApi(`/payments?${query}`, token);
}

export async function getPaymentById(token: string, id: string): Promise<ApiResponse<RentPayment>> {
    return fetchApi(`/payments/${id}`, token);
}

export async function createPayment(token: string, data: CreatePaymentInput): Promise<ApiResponse<RentPayment>> {
    return fetchApi("/payments", token, { method: "POST", body: JSON.stringify(data) });
}

export async function updatePayment(token: string, id: string, data: UpdatePaymentInput): Promise<ApiResponse<RentPayment>> {
    return fetchApi(`/payments/${id}`, token, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deletePayment(token: string, id: string): Promise<ApiResponse> {
    return fetchApi(`/payments/${id}`, token, { method: "DELETE" });
}
