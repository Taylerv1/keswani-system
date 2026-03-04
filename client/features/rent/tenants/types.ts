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

export interface TenantActiveContract {
  id: string;
  property_id: string;
  property_name: string;
  unit_id: string;
  unit_number: string;
  monthly_rent: number | string;
  currency: string;
  start_date: string;
  end_date: string | null;
  status: string;
}

export interface TenantListItem {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  active_contract: TenantActiveContract | null;
  created_at: string;
  updated_at: string;
}

export interface TenantPayment {
  id: string;
  amount: number | string;
  currency: string;
  payment_date: string;
  paid_at: string | null;
  status: string;
  period_start: string | null;
  period_end: string | null;
}

export interface TenantContract {
  id: string;
  unit_id: string;
  client_id: string;
  start_date: string;
  end_date: string | null;
  monthly_rent: number | string;
  currency: string;
  deposit_amount: number | string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  unit: {
    id: string;
    unit_number: string;
    property: {
      id: string;
      name: string;
    };
  };
  rent_payments: TenantPayment[];
}

export interface TenantMaintenance {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

export interface TenantDetail {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  contracts: TenantContract[];
  maintenance_requests: TenantMaintenance[];
}

export interface TenantQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  contract_presence?: Exclude<TenantContractFilter, "all">;
}

export interface CreateTenantInput {
  full_name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateTenantInput {
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface InviteTenantResponse {
  client_id: string;
  email: string;
  auth_user_id: string;
}

export interface TenantFormValues {
  full_name: string;
  email: string;
  phone: string;
  notes: string;
}

export type TenantContractFilter = "all" | "with_contract" | "without_contract";
