import type {
  ApiResponse,
  CreateReadingInput,
  EmployeeLookupItem,
  GenerateBillResponse,
  MeterLookupItem,
  PaginatedResponse,
  ReadingListItem,
  ReadingQueryParams,
} from "./types";

interface LookupResponse {
  employees?: EmployeeLookupItem[];
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

export async function getReadings(
  params?: ReadingQueryParams
): Promise<ApiResponse<PaginatedResponse<ReadingListItem>>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.month) query.set("month", params.month);
  if (params?.meter_id) query.set("meter_id", params.meter_id);

  const queryString = query.toString();
  return fetchApi(`/api/readings${queryString ? `?${queryString}` : ""}`);
}

export async function createReading(
  payload: CreateReadingInput
): Promise<ApiResponse<ReadingListItem>> {
  return fetchApi("/api/readings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateReadingBill(
  readingId: string
): Promise<ApiResponse<GenerateBillResponse>> {
  return fetchApi(`/api/readings/${readingId}/generate-bill`, {
    method: "POST",
  });
}

export async function getReadingMeters(): Promise<MeterLookupItem[]> {
  const PAGE_LIMIT = 50;
  let page = 1;
  let totalPages = 1;
  const allItems: MeterLookupItem[] = [];

  do {
    const response = await fetchApi<PaginatedResponse<MeterLookupItem>>(
      `/api/meters?page=${page}&limit=${PAGE_LIMIT}&status=active`
    );

    const items = response.data?.items ?? [];
    const pagination = response.data?.pagination;

    allItems.push(...items);
    totalPages = Math.max(1, pagination?.total_pages ?? 1);
    page += 1;
  } while (page <= totalPages);

  return allItems.filter((item) => item.status === "active");
}

export async function getElectricityEmployees(): Promise<EmployeeLookupItem[]> {
  const response = await fetchApi<LookupResponse>(
    "/api/lookups?resources=employees&context=electricity"
  );

  return response.data?.employees ?? [];
}
