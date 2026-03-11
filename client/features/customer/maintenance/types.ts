export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type BackendMaintenanceStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

export type BackendMaintenancePriority =
  | "low"
  | "medium"
  | "high"
  | "urgent"
  | "critical";

export type MaintenanceStatus = "open" | "in_progress" | "completed" | "closed";
export type MaintenancePriority = "low" | "medium" | "high";

export interface BackendMaintenanceItem {
  id: string;
  unit_id: string;
  unit_number: string;
  property_id: string;
  property_name: string;
  requested_by: string | null;
  requester_name: string | null;
  assigned_to: string | null;
  assignee_name: string | null;
  title: string;
  description: string | null;
  status: BackendMaintenanceStatus;
  priority: BackendMaintenancePriority;
  estimated_cost: string | number | null;
  actual_cost: string | number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceListResponse {
  items: BackendMaintenanceItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface CustomerMaintenanceItem {
  id: string;
  title: string;
  description: string;
  propertyName: string;
  unitNumber: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  createdAt: string;
  updatedAt: string;
}

