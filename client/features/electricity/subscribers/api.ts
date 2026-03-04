import type {
  ApiResponse,
  CreateSubscriberInput,
  PaginatedResponse,
  PropertyLookup,
  SubscriberDetail,
  SubscriberListItem,
  SubscriberQueryParams,
  UpdateSubscriberInput,
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

export async function getSubscribers(
  params?: SubscriberQueryParams
): Promise<ApiResponse<PaginatedResponse<SubscriberListItem>>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);

  const queryString = query.toString();
  return fetchApi(`/api/subscribers${queryString ? `?${queryString}` : ""}`);
}

export async function getSubscriberById(
  id: string
): Promise<ApiResponse<SubscriberDetail>> {
  return fetchApi(`/api/subscribers/${id}`);
}

export async function createSubscriber(
  payload: CreateSubscriberInput
): Promise<ApiResponse<SubscriberListItem>> {
  return fetchApi("/api/subscribers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSubscriber(
  id: string,
  payload: UpdateSubscriberInput
): Promise<ApiResponse<SubscriberListItem>> {
  return fetchApi(`/api/subscribers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteSubscriber(id: string): Promise<ApiResponse> {
  return fetchApi(`/api/subscribers/${id}`, {
    method: "DELETE",
  });
}

export async function getSubscriberProperties(): Promise<PropertyLookup[]> {
  const PAGE_LIMIT = 50;
  let page = 1;
  let totalPages = 1;
  const allItems: Array<{
    id: string;
    name: string;
    units?: Array<{ id: string; unit_number: string }>;
  }> = [];

  do {
    const response = await fetchApi<
      PaginatedResponse<{
        id: string;
        name: string;
        units?: Array<{ id: string; unit_number: string }>;
      }>
    >(`/api/properties?page=${page}&limit=${PAGE_LIMIT}`);

    const items = response.data?.items ?? [];
    const pagination = response.data?.pagination;

    allItems.push(...items);
    totalPages = Math.max(1, pagination?.total_pages ?? 1);
    page += 1;
  } while (page <= totalPages);

  return allItems.map((property) => ({
    id: property.id,
    name: property.name,
    units: (property.units ?? []).map((unit) => ({
      id: unit.id,
      unit_number: unit.unit_number,
    })),
  }));
}
