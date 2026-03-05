import type {
  ApiResponse,
  CreateMeterInput,
  MeterListItem,
  MeterQueryParams,
  PaginatedResponse,
  SubscriberLookupItem,
  UpdateMeterInput,
} from "./types";

interface SubscriberListItem {
  id: string;
  subscription_number: string;
  is_active: boolean;
  client: {
    full_name: string;
  };
}

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

export async function getMeters(
  params?: MeterQueryParams
): Promise<ApiResponse<PaginatedResponse<MeterListItem>>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.meter_type) query.set("meter_type", params.meter_type);
  if (params?.subscriber_id) query.set("subscriber_id", params.subscriber_id);

  const queryString = query.toString();
  return fetchApi(`/api/meters${queryString ? `?${queryString}` : ""}`);
}

export async function createMeter(
  payload: CreateMeterInput
): Promise<ApiResponse<MeterListItem>> {
  return fetchApi("/api/meters", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMeter(
  id: string,
  payload: UpdateMeterInput
): Promise<ApiResponse<MeterListItem>> {
  return fetchApi(`/api/meters/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteMeter(id: string): Promise<ApiResponse> {
  return fetchApi(`/api/meters/${id}`, {
    method: "DELETE",
  });
}

export async function getMeterSubscribers(): Promise<SubscriberLookupItem[]> {
  const PAGE_LIMIT = 50;
  let page = 1;
  let totalPages = 1;
  const allItems: SubscriberListItem[] = [];

  do {
    const response = await fetchApi<PaginatedResponse<SubscriberListItem>>(
      `/api/subscribers?page=${page}&limit=${PAGE_LIMIT}&status=active`
    );

    const items = response.data?.items ?? [];
    const pagination = response.data?.pagination;

    allItems.push(...items);
    totalPages = Math.max(1, pagination?.total_pages ?? 1);
    page += 1;
  } while (page <= totalPages);

  return allItems
    .filter((item) => item.is_active)
    .map((item) => ({
      id: item.id,
      subscription_number: item.subscription_number,
      client_name: item.client.full_name,
      is_active: item.is_active,
    }));
}
