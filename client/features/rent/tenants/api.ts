import type {
  ApiResponse,
  CreateTenantInput,
  PaginatedResponse,
  TenantDetail,
  TenantListItem,
  TenantQueryParams,
  UpdateTenantInput,
} from "./types";

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
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

export async function getTenants(
  params?: TenantQueryParams
): Promise<ApiResponse<PaginatedResponse<TenantListItem>>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.contract_presence) {
    query.set("contract_presence", params.contract_presence);
  }

  const queryString = query.toString();

  return fetchApi(`/api/clients${queryString ? `?${queryString}` : ""}`);
}

export async function getTenantById(
  id: string
): Promise<ApiResponse<TenantDetail>> {
  return fetchApi(`/api/clients/${id}`);
}

export async function createTenant(
  payload: CreateTenantInput
): Promise<ApiResponse<TenantListItem>> {
  return fetchApi("/api/clients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTenant(
  id: string,
  payload: UpdateTenantInput
): Promise<ApiResponse<TenantListItem>> {
  return fetchApi(`/api/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteTenant(id: string): Promise<ApiResponse> {
  return fetchApi(`/api/clients/${id}`, {
    method: "DELETE",
  });
}
