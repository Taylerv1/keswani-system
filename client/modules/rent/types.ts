export interface Property {
  id: string;
  name: string;
  nameAr: string;
  type: "building" | "house" | "land";
  address: string;
  addressAr: string;
  totalUnits: number;
  rentedUnits: number;
  vacantUnits: number;
  maintenanceUnits: number;
  status: "active" | "vacant" | "inactive";
  monthlyIncome: number;
  image: string | null;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  propertyId: string;
  unitNumber: string;
  contractId: string;
  paymentStatus: "paid" | "late" | "overdue" | "pending";
  balance: number;
  joinDate: string;
}

export interface Contract {
  id: string;
  tenantId: string;
  propertyId: string;
  unitNumber: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  status: "active" | "expired" | "terminated";
  autoRenew: boolean;
}

export interface Payment {
  id: string;
  tenantId: string;
  contractId: string;
  amount: number;
  date: string | null;
  method: "cash" | "bank_transfer" | null;
  status: "paid" | "overdue" | "pending";
  month: string;
  receiptNumber: string | null;
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  unitNumber: string;
  tenantId: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  priority: "high" | "medium" | "low";
  status: "open" | "in_progress" | "completed" | "closed";
  createdAt: string;
  updatedAt: string;
  cost: number | null;
}

export interface Notification {
  id: string;
  type: "late_payment" | "contract_ending" | "maintenance" | "vacant_property";
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  relatedId: string;
  read: boolean;
  createdAt: string;
}

export interface RentData {
  properties: Property[];
  tenants: Tenant[];
  contracts: Contract[];
  payments: Payment[];
  maintenanceRequests: MaintenanceRequest[];
  notifications: Notification[];
}
