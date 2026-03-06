import type {
  ApiResponse,
  ElectricityReportsQueryParams,
  ElectricityReportsResponse,
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

export async function getElectricityReports(
  params?: ElectricityReportsQueryParams
): Promise<ApiResponse<ElectricityReportsResponse>> {
  const query = new URLSearchParams();
  if (params?.from_month) query.set("from_month", params.from_month);
  if (params?.to_month) query.set("to_month", params.to_month);

  const queryString = query.toString();
  return fetchApi(`/api/electricity/reports${queryString ? `?${queryString}` : ""}`);
}
