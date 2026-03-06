import type {
  ApiResponse,
  BillDetailItem,
  BillListResponse,
  BillQueryParams,
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

export async function getBills(
  params?: BillQueryParams
): Promise<ApiResponse<BillListResponse>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.month) query.set("month", params.month);
  if (params?.subscriber_id) query.set("subscriber_id", params.subscriber_id);
  if (params?.meter_id) query.set("meter_id", params.meter_id);

  const queryString = query.toString();
  return fetchApi(`/api/electricity/bills${queryString ? `?${queryString}` : ""}`);
}

export async function getBillById(
  id: string
): Promise<ApiResponse<BillDetailItem>> {
  return fetchApi(`/api/electricity/bills/${id}`);
}
