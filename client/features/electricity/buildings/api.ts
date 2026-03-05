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

export type ElectricityBuildingType = "building" | "house" | "commercial";

export interface ElectricityBuildingUnitInput {
  id?: string;
  unit_number: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  description?: string;
}

export interface ElectricityBuildingDetail {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  type: "building" | "house" | "land" | "commercial";
  is_for_rent: boolean;
  is_for_electricity: boolean;
  owner_notes: string | null;
  units: {
    id: string;
    unit_number: string;
    floor: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    area_sqm: number | string | null;
    description: string | null;
  }[];
}

export interface UpsertElectricityBuildingInput {
  name: string;
  address?: string;
  city?: string;
  type: ElectricityBuildingType;
  owner_notes?: string | null;
  is_for_rent?: boolean;
  is_for_electricity?: boolean;
  units?: ElectricityBuildingUnitInput[];
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

export async function createElectricityBuilding(
  payload: UpsertElectricityBuildingInput
): Promise<ApiResponse<ElectricityBuildingItem>> {
  return fetchApi("/api/electricity/buildings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateElectricityBuilding(
  id: string,
  payload: UpsertElectricityBuildingInput
): Promise<ApiResponse<ElectricityBuildingItem>> {
  return fetchApi(`/api/electricity/buildings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getElectricityBuildingById(
  id: string
): Promise<ApiResponse<ElectricityBuildingDetail>> {
  return fetchApi(`/api/properties/${id}`);
}
