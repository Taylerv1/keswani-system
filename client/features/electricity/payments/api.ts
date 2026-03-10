import type {
  ApiResponse,
  CollectorLookupItem,
  CreateElectricityPaymentInput,
  ElectricityPaymentItem,
  ElectricityPaymentListResponse,
  ElectricityPaymentQueryParams,
  ElectricitySubscriberLookupItem,
  OpenBillLookupItem,
} from "./types";

interface SubscriberListItem {
  id: string;
  subscription_number: string;
  is_active: boolean;
  client: {
    full_name: string;
  };
}

interface BillListItem {
  id: string;
  subscriber_id: string;
  subscriber_name: string;
  subscription_number: string;
  meter_number: string;
  month: string;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  currency: string;
  status: "pending" | "overdue" | "paid" | "cancelled";
}

interface BillListResponse {
  items: BillListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

interface LookupResponse {
  employees?: CollectorLookupItem[];
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

export async function getElectricityPayments(
  params?: ElectricityPaymentQueryParams
): Promise<ApiResponse<ElectricityPaymentListResponse>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.month) query.set("month", params.month);
  if (params?.subscriber_id) query.set("subscriber_id", params.subscriber_id);
  if (params?.bill_id) query.set("bill_id", params.bill_id);

  const queryString = query.toString();
  return fetchApi(`/api/electricity/payments${queryString ? `?${queryString}` : ""}`);
}

export async function createElectricityPayment(
  payload: CreateElectricityPaymentInput
): Promise<ApiResponse<ElectricityPaymentItem>> {
  return fetchApi("/api/electricity/payments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPaymentSubscribers(): Promise<ElectricitySubscriberLookupItem[]> {
  const PAGE_LIMIT = 50;
  let page = 1;
  let totalPages = 1;
  const allItems: SubscriberListItem[] = [];

  do {
    const response = await fetchApi<{
      items: SubscriberListItem[];
      pagination: { total_pages: number };
    }>(`/api/subscribers?page=${page}&limit=${PAGE_LIMIT}&status=active`);

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

export async function getOpenBills(
  subscriberId?: string
): Promise<OpenBillLookupItem[]> {
  const PAGE_LIMIT = 50;
  let page = 1;
  let totalPages = 1;
  const allItems: BillListItem[] = [];

  do {
    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("limit", String(PAGE_LIMIT));
    query.set("status", "open");
    if (subscriberId) query.set("subscriber_id", subscriberId);

    const response = await fetchApi<BillListResponse>(
      `/api/electricity/bills?${query.toString()}`
    );

    const items = response.data?.items ?? [];
    const pagination = response.data?.pagination;

    allItems.push(...items);
    totalPages = Math.max(1, pagination?.total_pages ?? 1);
    page += 1;
  } while (page <= totalPages);

  return allItems
    .filter((item) => item.outstanding_amount > 0)
    .map((item) => ({
      id: item.id,
      subscriber_id: item.subscriber_id,
      subscriber_name: item.subscriber_name,
      subscription_number: item.subscription_number,
      meter_number: item.meter_number,
      month: item.month,
      total_amount: item.total_amount,
      paid_amount: item.paid_amount,
      outstanding_amount: item.outstanding_amount,
      currency: item.currency,
      status: item.status,
    }));
}

export async function getElectricityCollectors(): Promise<CollectorLookupItem[]> {
  const response = await fetchApi<LookupResponse>(
    "/api/lookups?resources=employees&context=electricity"
  );

  return response.data?.employees ?? [];
}
