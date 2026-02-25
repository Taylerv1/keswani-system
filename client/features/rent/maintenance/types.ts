import type { Property, Tenant } from "@/features/rent/types";
import type { PropertyLookup } from "../properties/types";

export type { Property, Tenant };
export type { PropertyLookup };

export type MaintenancePriority = "high" | "medium" | "low";
export type MaintenanceStatus = "open" | "in_progress" | "completed" | "closed";

export interface MaintenanceRequest {
  id: string;
  unitId: string;
  propertyId: string;
  propertyName: string;
  unitNumber: string;
  tenantId: string;
  tenantName: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  createdAt: string;
  updatedAt: string;
  cost: number | null;
}

export type BackendMaintenanceStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type BackendMaintenancePriority = "low" | "medium" | "high" | "urgent" | "critical";

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
  description: string;
  status: BackendMaintenanceStatus;
  priority: BackendMaintenancePriority;
  estimated_cost: string | number | null;
  actual_cost: string | number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceFormData {
  propertyId: string;
  unitNumber: string;
  tenantId: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  createdAt: string;
  updatedAt: string;
  cost: number | null;
}

export type TranslateFn = (key: string) => string;
