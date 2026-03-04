import type {
  BackendMaintenanceItem,
  BackendMaintenancePriority,
  BackendMaintenanceStatus,
  CustomerMaintenanceItem,
  MaintenancePriority,
  MaintenanceStatus,
} from "./types";

export const PAGE_SIZE = 8;

export function mapStatus(status: BackendMaintenanceStatus): MaintenanceStatus {
  if (status === "pending") return "open";
  if (status === "cancelled") return "closed";
  return status;
}

export function statusToBackend(status: MaintenanceStatus): BackendMaintenanceStatus {
  if (status === "open") return "pending";
  if (status === "closed") return "cancelled";
  return status;
}

export function mapPriority(priority: BackendMaintenancePriority): MaintenancePriority {
  if (priority === "critical" || priority === "urgent" || priority === "high") {
    return "high";
  }
  if (priority === "low") return "low";
  return "medium";
}

export function mapMaintenanceItem(
  item: BackendMaintenanceItem
): CustomerMaintenanceItem {
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

export function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale);
}

