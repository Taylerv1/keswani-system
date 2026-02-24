// ============================================================
// Property Module — API Layer (via Next.js /api proxy)
// All property CRUD calls should be imported through this file.
// ============================================================

import type {
  PropertyDto,
  PropertyLookup,
  CreatePropertyInput,
  UpdatePropertyInput,
} from "./types";

// Re-export all types so consumers can import types from here too
export type {
  PropertyDto,
  PropertyUnitDto,
  PropertyLookup,
  CreatePropertyInput,
  UpdatePropertyInput,
} from "./types";

// --------------- Generic API response wrappers ---------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// --------------- Internal fetch helper ---------------

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const res = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data: ApiResponse<T> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

// --------------- CRUD functions ---------------

export async function getProperties(
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: "full" | "vacant";
  },
): Promise<ApiResponse<PaginatedResponse<PropertyDto>>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.type) query.set("type", params.type);
  if (params?.status) query.set("status", params.status);
  const queryString = query.toString();
  return fetchApi(`/api/properties${queryString ? `?${queryString}` : ""}`);
}

export async function getPropertyById(
  id: string,
): Promise<ApiResponse<PropertyDto>> {
  return fetchApi(`/api/properties/${id}`);
}

export async function getPropertiesLookup(): Promise<
  ApiResponse<PropertyLookup[]>
> {
  return fetchApi("/api/properties/lookup");
}

export async function createProperty(
  data: CreatePropertyInput,
): Promise<ApiResponse<PropertyDto>> {
  return fetchApi("/api/properties", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProperty(
  id: string,
  data: UpdatePropertyInput,
): Promise<ApiResponse<PropertyDto>> {
  return fetchApi(`/api/properties/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteProperty(
  id: string,
): Promise<ApiResponse> {
  return fetchApi(`/api/properties/${id}`, { method: "DELETE" });
}
