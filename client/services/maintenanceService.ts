import type {
  BackendMaintenanceItem,
  BackendMaintenancePriority,
  BackendMaintenanceStatus,
} from "@/features/customer/maintenance/types";

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  propertyName: string;
  unitNumber: string;
  status: "open" | "in_progress" | "completed" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceRequestPayload {
  title: string;
  description: string;
  estimated_cost?: number;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface MaintenanceListResponse {
  items: BackendMaintenanceItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface MaintenanceRequestsPage {
  items: MaintenanceRequest[];
  totalPages: number;
}

interface CreatedMaintenanceResponse {
  id: string;
  title: string;
  description: string | null;
  status: BackendMaintenanceStatus;
  priority: BackendMaintenancePriority;
  created_at: string;
  updated_at: string;
  unit?: {
    unit_number?: string | null;
    property?: {
      name?: string | null;
    } | null;
  } | null;
}

function mapStatus(status: BackendMaintenanceStatus): MaintenanceRequest["status"] {
  if (status === "pending") return "open";
  if (status === "cancelled") return "closed";
  return status;
}

function mapPriority(priority: BackendMaintenancePriority): MaintenanceRequest["priority"] {
  if (priority === "critical" || priority === "urgent" || priority === "high") {
    return "high";
  }
  if (priority === "low") return "low";
  return "medium";
}

function mapMaintenanceItem(item: BackendMaintenanceItem): MaintenanceRequest {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? "",
    propertyName: item.property_name,
    unitNumber: item.unit_number,
    status: mapStatus(item.status),
    priority: mapPriority(item.priority),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function mapCreatedMaintenance(item: CreatedMaintenanceResponse): MaintenanceRequest {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? "",
    propertyName: item.unit?.property?.name ?? "-",
    unitNumber: item.unit?.unit_number ?? "-",
    status: mapStatus(item.status),
    priority: mapPriority(item.priority),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    cache: options.method === "GET" || !options.method ? "no-store" : undefined,
    ...options,
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || payload.message || `Request failed: ${response.status}`);
  }

  return payload;
}

export async function fetchMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  const firstPage = await fetchMaintenanceRequestsPage(1, 100);

  if (firstPage.totalPages === 1) {
    return firstPage.items;
  }

  const remaining = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      fetchMaintenanceRequestsPage(index + 2, 100)
    )
  );

  return [
    ...firstPage.items,
    ...remaining.flatMap((page) => page.items),
  ];
}

export async function fetchMaintenanceRequestsPage(
  page: number,
  limit: number
): Promise<MaintenanceRequestsPage> {
  const response = await request<MaintenanceListResponse>(
    `/api/maintenance?page=${page}&limit=${limit}`,
    { method: "GET" }
  );

  return {
    items: (response.data?.items ?? []).map(mapMaintenanceItem),
    totalPages: Math.max(1, response.data?.pagination.total_pages ?? 1),
  };
}

export async function createMaintenanceRequest(
  payload: CreateMaintenanceRequestPayload
): Promise<MaintenanceRequest> {
  const response = await request<CreatedMaintenanceResponse>("/api/maintenance", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.data) {
    throw new Error("Maintenance request was created but no payload was returned.");
  }

  return mapCreatedMaintenance(response.data);
}
