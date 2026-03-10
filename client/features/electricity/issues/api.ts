import type { BackendIssueItem, ElectricityIssue, SubscriberLookup, EmployeeLookup } from "./types";
import { mapBackendIssue } from "./utils";

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

export async function getElectricityIssues(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
}): Promise<ApiResponse<PaginatedResponse<ElectricityIssue>>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.priority) query.set("priority", params.priority);
  if (params?.category) query.set("category", params.category);
  const queryString = query.toString();

  const response = await fetchApi<PaginatedResponse<BackendIssueItem>>(
    `/api/electricity-issues${queryString ? `?${queryString}` : ""}`,
    { method: "GET" }
  );

  return {
    ...response,
    data: response.data
      ? {
          ...response.data,
          items: response.data.items.map(mapBackendIssue),
        }
      : undefined,
  };
}

export async function getIssueLookups(): Promise<{
  subscribers: SubscriberLookup[];
  employees: EmployeeLookup[];
}> {
  const [subscribersRes, employeesRes] = await Promise.allSettled([
    fetchApi<PaginatedResponse<{
      id: string;
      subscription_number: string;
      is_active: boolean;
      client: { id: string; full_name: string };
      property: { id: string; name: string } | null;
      unit: { id: string; unit_number: string } | null;
    }>>("/api/subscribers?limit=100&status=active", { method: "GET" }),
    fetchApi<{ employees: { id: string; full_name: string }[] }>(
      "/api/lookups?resources=employees&context=electricity",
      { method: "GET" }
    ),
  ]);

  const subscribers: SubscriberLookup[] =
    subscribersRes.status === "fulfilled"
      ? (subscribersRes.value.data?.items ?? [])
          .filter((s) => s.is_active)
          .map((s) => ({
            id: s.id,
            subscriptionNumber: s.subscription_number,
            clientName: s.client?.full_name ?? "",
            propertyName: s.property?.name ?? "",
            unitNumber: s.unit?.unit_number ?? "",
          }))
      : [];

  const employees: EmployeeLookup[] =
    employeesRes.status === "fulfilled"
      ? (employeesRes.value.data?.employees ?? []).map((e) => ({
          id: e.id,
          fullName: e.full_name,
        }))
      : [];

  return { subscribers, employees };
}

export async function createElectricityIssue(payload: {
  subscriber_id: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
}): Promise<ApiResponse> {
  return fetchApi("/api/electricity-issues", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateElectricityIssue(
  id: string,
  payload: {
    title?: string;
    description?: string | null;
    category?: string;
    priority?: string;
    status?: string;
    assigned_to?: string | null;
  }
): Promise<ApiResponse> {
  return fetchApi(`/api/electricity-issues/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteElectricityIssue(id: string): Promise<ApiResponse> {
  return fetchApi(`/api/electricity-issues/${id}`, {
    method: "DELETE",
  });
}
