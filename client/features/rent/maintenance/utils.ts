import type { MaintenanceFormData, MaintenancePriority, MaintenanceRequest, Property, Tenant } from "./types";

export const PAGE_SIZE = 6;

export function createEmptyForm(): MaintenanceFormData {
  const today = new Date().toISOString().split("T")[0];
  return {
    propertyId: "",
    unitNumber: "",
    tenantId: "",
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
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
        request.titleAr.includes(query) ||
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
