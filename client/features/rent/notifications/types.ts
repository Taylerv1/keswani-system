export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  section: string;
  title: string;
  message: string;
  relatedId: string | null;
  relatedType: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface NotificationQueryParams {
  section?: string;
  type?: string;
  is_read?: "true" | "false";
  search?: string;
  page?: number;
  limit?: number;
}

export type NotificationTypeFilter =
  | "all"
  | "late_payment"
  | "contract_ending"
  | "maintenance"
  | "vacant_property";

export type NotificationReadFilter = "all" | "unread" | "read";

export interface ContractNotificationDetail {
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
    property_id: string;
    property: {
      id: string;
      name: string;
    };
  };
  client: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
}

export interface MaintenanceNotificationDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  estimated_cost: number | string | null;
  actual_cost: number | string | null;
  created_at: string;
  updated_at: string;
  unit: {
    unit_number: string;
    property: {
      name: string;
    };
  };
  requester: {
    id: string;
    full_name: string;
  } | null;
}
