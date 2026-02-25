import type {
  BackendMaintenanceItem,
  BackendMaintenancePriority,
  BackendMaintenanceStatus,
  MaintenanceFormData,
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceStatus,
  Property,
  Tenant,
} from "./types";

export const PAGE_SIZE = 6;

export function backendStatusToUi(status: BackendMaintenanceStatus): MaintenanceStatus {
  if (status === "pending") return "open";
  if (status === "cancelled") return "closed";
  return status;
}

export function uiStatusToBackend(status: MaintenanceStatus): BackendMaintenanceStatus {
  if (status === "open") return "pending";
  if (status === "closed") return "cancelled";
  return status;
}

export function backendPriorityToUi(priority: BackendMaintenancePriority): MaintenancePriority {
  if (priority === "urgent" || priority === "critical") return "high";
  if (priority === "medium") return "medium";
  return "low";
}

export function uiPriorityToBackend(priority: MaintenancePriority): BackendMaintenancePriority {
  if (priority === "high") return "high";
  if (priority === "medium") return "medium";
  return "low";
}

function toNumber(value: string | number | null): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapBackendMaintenance(item: BackendMaintenanceItem): MaintenanceRequest {
  const createdAt = item.created_at.split("T")[0] ?? item.created_at;
  const updatedAt = item.updated_at.split("T")[0] ?? item.updated_at;

  return {
    id: item.id,
    unitId: item.unit_id,
    propertyId: item.property_id,
    propertyName: item.property_name,
    unitNumber: item.unit_number,
    tenantId: item.requested_by ?? "",
    tenantName: item.requester_name ?? "",
    title: item.title,
    description: item.description,
    priority: backendPriorityToUi(item.priority),
    status: backendStatusToUi(item.status),
    createdAt,
    updatedAt,
    cost: toNumber(item.actual_cost) ?? toNumber(item.estimated_cost),
  };
}

export function createEmptyForm(): MaintenanceFormData {
  const today = new Date().toISOString().split("T")[0];
  return {
    propertyId: "",
    unitNumber: "",
    tenantId: "",
    title: "",
    description: "",
    priority: "medium",
    status: "open",
    createdAt: today,
    updatedAt: today,
    cost: null,
  };
}

export function getPropertyName(properties: Property[], id: string): string {
  const property = properties.find((item) => item.id === id);
  return property ? property.name : id;
}

export function getTenantName(
  tenants: Tenant[],
  id: string,
  locale: string
): string {
  const tenant = tenants.find((item) => item.id === id);
  if (!tenant) return id;
  return locale === "ar" ? tenant.nameAr : tenant.name;
}

export function priorityDot(priority: MaintenancePriority): string {
  if (priority === "high") return "bg-card-red";
  if (priority === "medium") return "bg-card-orange";
  return "bg-card-blue";
}

export function filterMaintenanceRequests(
  maintenanceRequests: MaintenanceRequest[],
  search: string,
  filterStatus: string,
  filterPriority: string,
  properties: Property[],
  tenants: Tenant[],
  locale: string
): MaintenanceRequest[] {
  let items = maintenanceRequests;

  if (search) {
    const query = search.toLowerCase();
    items = items.filter(
      (request) =>
        request.title.toLowerCase().includes(query) ||
        request.propertyName.toLowerCase().includes(query) ||
        request.tenantName.toLowerCase().includes(query) ||
        getPropertyName(properties, request.propertyId)
          .toLowerCase()
          .includes(query) ||
        getTenantName(tenants, request.tenantId, locale)
          .toLowerCase()
          .includes(query)
    );
  }

  if (filterStatus !== "all") {
    items = items.filter((request) => request.status === filterStatus);
  }

  if (filterPriority !== "all") {
    items = items.filter((request) => request.priority === filterPriority);
  }

  return items;
}
