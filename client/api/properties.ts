// ============================================================
// Keswani System — Frontend Properties API Helpers
// ============================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

interface PropertyUnit {
    id: string;
    unit_number: string;
    floor: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    area_sqm: number | null;
    description: string | null;
    is_available: boolean;
}

interface Property {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    type: "building" | "house" | "land" | "commercial";
    managed_by: string | null;
    manager_name: string | null;
    owner_notes: string | null;
    total_units: number;
    rented_units: number;
    available_units: number;
    units: PropertyUnit[];
    created_at: string;
    updated_at: string;
}

interface PropertyLookup {
    id: string;
    name: string;
    type: string;
    units: { id: string; unit_number: string; floor: number | null; is_available: boolean }[];
}

interface CreatePropertyInput {
    name: string;
    address?: string;
    city?: string;
    type: "building" | "house" | "land" | "commercial";
    managed_by?: string;
    owner_notes?: string;
    units?: {
        unit_number: string;
        floor?: number;
        bedrooms?: number;
        bathrooms?: number;
        area_sqm?: number;
        description?: string;
    }[];
}

interface UpdatePropertyInput {
    name?: string;
    address?: string;
    city?: string;
    type?: "building" | "house" | "land" | "commercial";
    managed_by?: string | null;
    owner_notes?: string | null;
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

export async function getProperties(
    token: string,
    params?: { page?: number; limit?: number; search?: string; type?: string }
): Promise<ApiResponse<PaginatedResponse<Property>>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    if (params?.type) query.set("type", params.type);
    return fetchApi(`/properties?${query}`, token);
}

export async function getPropertyById(token: string, id: string): Promise<ApiResponse<Property>> {
    return fetchApi(`/properties/${id}`, token);
}

export async function getPropertiesLookup(token: string): Promise<ApiResponse<PropertyLookup[]>> {
    return fetchApi("/properties/lookup", token);
}

export async function createProperty(token: string, data: CreatePropertyInput): Promise<ApiResponse<Property>> {
    return fetchApi("/properties", token, { method: "POST", body: JSON.stringify(data) });
}

export async function updateProperty(token: string, id: string, data: UpdatePropertyInput): Promise<ApiResponse<Property>> {
    return fetchApi(`/properties/${id}`, token, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteProperty(token: string, id: string): Promise<ApiResponse> {
    return fetchApi(`/properties/${id}`, token, { method: "DELETE" });
}
