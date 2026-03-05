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

export interface ElectricityBuildingItem {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  type: "building" | "house" | "land" | "commercial";
  total_units: number;
  subscriber_count: number;
  total_consumption_kwh: number;
  is_for_rent: boolean;
  is_for_electricity: boolean;
  created_at: string;
  updated_at: string;
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
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

export async function getElectricityBuildings(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ApiResponse<PaginatedResponse<ElectricityBuildingItem>>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);

  const queryString = query.toString();
  return fetchApi(
    `/api/electricity/buildings${queryString ? `?${queryString}` : ""}`
  );
}
