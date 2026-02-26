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

export type ContractStatus = "pending" | "active" | "expired" | "terminated";
export type ContractStatusFilter = "all" | ContractStatus;

export interface ContractListItem {
  id: string;
  unit_id: string;
  unit_number: string;
  property_id: string;
  property_name: string;
  client_id: string;
  client_name: string;
  start_date: string;
  end_date: string | null;
  monthly_rent: number | string;
  currency: string;
  deposit_amount: number | string | null;
  status: ContractStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractDetail {
  id: string;
  unit_id: string;
  client_id: string;
  start_date: string;
  end_date: string | null;
  monthly_rent: number | string;
  currency: string;
  deposit_amount: number | string | null;
  status: ContractStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyLookupItem {
  id: string;
  name: string;
  type: string;
  units: {
    id: string;
    unit_number: string;
    floor: number | null;
  }[];
}

export interface ClientLookupItem {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
}

export interface CreateContractClientInput {
  full_name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface CreatedContractClient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LookupBundle {
  properties?: PropertyLookupItem[];
  clients?: ClientLookupItem[];
}

export interface ContractQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ContractStatus;
}

export interface CreateContractInput {
  unit_id: string;
  client_id: string;
  start_date: string;
  end_date?: string;
  monthly_rent: number;
  currency: string;
  deposit_amount: number;
  status: ContractStatus;
  notes?: string;
}

export interface ContractFormValues {
  client_id: string;
  property_id: string;
  unit_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  currency: string;
  deposit_amount: number;
  status: ContractStatus;
  notes: string;
}

export interface ContractClientFormValues {
  full_name: string;
  email: string;
  phone: string;
  notes: string;
}
