import type {
  ApiResponse,
  ContractNotificationDetail,
  MaintenanceNotificationDetail,
  NotificationListResponse,
  NotificationQueryParams,
} from "./types";

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: options.method === "GET" || !options.method ? "no-store" : undefined,
    ...options,
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

export async function getNotifications(
  params: NotificationQueryParams
): Promise<ApiResponse<NotificationListResponse>> {
  const query = new URLSearchParams();
  if (params.section) query.set("section", params.section);
  if (params.type) query.set("type", params.type);
  if (params.is_read) query.set("is_read", params.is_read);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const queryString = query.toString();

  return fetchApi(`/api/notifications${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
  });
}

export async function markNotificationReadApi(id: string): Promise<ApiResponse> {
  return fetchApi(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsReadApi(
  section?: string
): Promise<ApiResponse> {
  const query = section ? `?section=${section}` : "";
  return fetchApi(`/api/notifications/read-all${query}`, {
    method: "PATCH",
  });
}

export async function getContractNotificationDetail(
  id: string
): Promise<ApiResponse<ContractNotificationDetail>> {
  return fetchApi(`/api/contracts/${id}`, {
    method: "GET",
  });
}

export async function getMaintenanceNotificationDetail(
  id: string
): Promise<ApiResponse<MaintenanceNotificationDetail>> {
  return fetchApi(`/api/maintenance/${id}`, {
    method: "GET",
  });
}
