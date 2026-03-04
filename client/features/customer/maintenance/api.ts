import type {
  ApiResponse,
  CustomerMaintenanceItem,
  MaintenanceListResponse,
  MaintenanceStatus,
} from "./types";
import { mapMaintenanceItem, statusToBackend } from "./utils";

export interface CustomerMaintenanceList {
  items: CustomerMaintenanceItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
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

  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  return payload;
}

export async function getCustomerMaintenanceRequests(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: MaintenanceStatus | "all";
}): Promise<ApiResponse<CustomerMaintenanceList>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status && params.status !== "all") {
    query.set("status", statusToBackend(params.status));
  }

  const queryString = query.toString();
  const response = await fetchApi<MaintenanceListResponse>(
    `/api/maintenance${queryString ? `?${queryString}` : ""}`,
    { method: "GET" }
  );

  if (!response.data) {
    return {
      ...response,
      data: {
        items: [],
        pagination: { page: 1, limit: 0, total: 0, total_pages: 1 },
      },
    };
  }

  return {
    ...response,
    data: {
      items: response.data.items.map(mapMaintenanceItem),
      pagination: response.data.pagination,
    },
  };
}

export async function createCustomerMaintenanceRequest(payload: {
  title: string;
  description: string;
  estimated_cost?: number;
}): Promise<ApiResponse> {
  return fetchApi("/api/maintenance", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

