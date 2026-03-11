export {
  getCustomerMaintenanceRequests,
  createCustomerMaintenanceRequest,
} from "../maintenance/api";

export type { CustomerMaintenanceList } from "../maintenance/api";

import type {
  ApiResponse,
  BackendElectricityIssue,
  CustomerElectricityIssue,
  IssueStatus,
} from "./types";

export interface CustomerElectricityIssueList {
  items: CustomerElectricityIssue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

interface PaginatedBackendResponse {
  items: BackendElectricityIssue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

function mapIssue(item: BackendElectricityIssue): CustomerElectricityIssue {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? "",
    category: item.category,
    status: item.status,
    priority: item.priority,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
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

export async function getCustomerElectricityIssues(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: IssueStatus | "all";
}): Promise<ApiResponse<CustomerElectricityIssueList>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status && params.status !== "all") {
    query.set("status", params.status);
  }

  const queryString = query.toString();
  const response = await fetchApi<PaginatedBackendResponse>(
    `/api/electricity-issues${queryString ? `?${queryString}` : ""}`,
    { method: "GET" },
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
      items: response.data.items.map(mapIssue),
      pagination: response.data.pagination,
    },
  };
}

export async function createCustomerElectricityIssue(payload: {
  title: string;
  description: string;
  category?: string;
}): Promise<ApiResponse> {
  return fetchApi("/api/electricity-issues", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
