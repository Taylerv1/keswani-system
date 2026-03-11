import type { ApiResponse, ElectricityDebtsResponse } from "./types";

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

export async function getElectricityDebts(): Promise<ApiResponse<ElectricityDebtsResponse>> {
  return fetchApi("/api/electricity/debts");
}
