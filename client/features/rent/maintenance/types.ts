import type { MaintenanceRequest, Property, Tenant } from "@/features/rent/types";

export type { MaintenanceRequest, Property, Tenant };

export type MaintenancePriority = MaintenanceRequest["priority"];
export type MaintenanceStatus = MaintenanceRequest["status"];

export interface MaintenanceFormData {
  propertyId: string;
  unitNumber: string;
  tenantId: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  createdAt: string;
  updatedAt: string;
  cost: number | null;
}

export type TranslateFn = (key: string) => string;
