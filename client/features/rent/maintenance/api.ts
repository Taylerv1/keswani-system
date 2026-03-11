import type {
  BackendMaintenanceItem,
  BackendMaintenancePriority,
  BackendMaintenanceStatus,
  PropertyLookup,
  Tenant,
  MaintenanceRequest,
} from "./types";
import {
  mapBackendMaintenance,
} from "./utils";

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

interface LookupClientsItem {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  contract_id?: string | null;
  property_id?: string | null;
  unit_number?: string | null;
}

interface LookupResponse {
  properties?: PropertyLookup[];
  clients?: LookupClientsItem[];
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(endpoint, {
    headers: { "Content-Type": "application/json" },
    cache: options.method === "GET" || !options.method ? "no-store" : undefined,
    ...options,
  });

  const data: ApiResponse<T> = await response.json();
  if (!response.ok || !data.success) {
    const details = (data as { details?: unknown }).details;
    const detailsText = details ? ` | ${JSON.stringify(details)}` : "";
    throw new Error((data.error || `Request failed: ${response.status}`) + detailsText);
  }

  return data;
}

export async function getMaintenanceRequests(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
}): Promise<ApiResponse<PaginatedResponse<MaintenanceRequest>>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.priority) query.set("priority", params.priority);
  const queryString = query.toString();

  const response = await fetchApi<PaginatedResponse<BackendMaintenanceItem>>(
    `/api/maintenance${queryString ? `?${queryString}` : ""}`,
    { method: "GET" }
  );

  return {
    ...response,
    data: response.data
      ? {
          ...response.data,
          items: response.data.items.map(mapBackendMaintenance),
        }
      : undefined,
  };
}

export async function createMaintenanceRequest(payload: {
  unit_id?: string;
  requested_by?: string;
  title: string;
  description?: string;
  priority?: BackendMaintenancePriority;
  estimated_cost?: number;
}): Promise<ApiResponse> {
  return fetchApi("/api/maintenance", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMaintenanceLookups(): Promise<
  ApiResponse<{ properties: PropertyLookup[]; tenants: Tenant[] }>
> {
  const response = await fetchApi<LookupResponse>(
    "/api/lookups?resources=properties,clients&context=maintenance",
    { method: "GET" }
  );

  const properties = response.data?.properties ?? [];
  const tenants: Tenant[] = (response.data?.clients ?? []).map((client) => ({
    id: client.id,
    name: client.full_name,
    nameAr: client.full_name,
    email: client.email ?? "",
    phone: client.phone ?? "",
    propertyId: client.property_id ?? "",
    unitNumber: client.unit_number ?? "",
    contractId: client.contract_id ?? "",
    paymentStatus: "pending",
    balance: 0,
    joinDate: "",
  }));

  return {
    ...response,
    data: {
      properties,
      tenants,
    },
  };
}

export async function updateMaintenanceRequest(
  id: string,
  payload: {
    unit_id?: string;
    requested_by?: string | null;
    title?: string;
    description?: string;
    priority?: BackendMaintenancePriority;
    status?: BackendMaintenanceStatus;
    estimated_cost?: number;
    actual_cost?: number;
  }
): Promise<ApiResponse> {
  return fetchApi(`/api/maintenance/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteMaintenanceRequest(id: string): Promise<ApiResponse> {
  return fetchApi(`/api/maintenance/${id}`, {
    method: "DELETE",
  });
}
