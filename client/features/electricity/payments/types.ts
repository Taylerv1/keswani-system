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

export interface ElectricityPaymentItem {
  id: string;
  bill_id: string;
  meter_id: string;
  meter_number: string;
  subscriber_id: string;
  subscriber_name: string;
  subscription_number: string;
  amount: number;
  currency: string;
  payment_date: string | null;
  status: "pending" | "paid" | "overdue" | "cancelled";
  payment_method: string;
  collector_id: string | null;
  collector_name: string | null;
  receipt_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  bill: {
    id: string;
    status: "pending" | "paid" | "overdue" | "cancelled";
    total_amount: number;
    currency: string;
    billing_period_start: string | null;
    billing_period_end: string | null;
  };
}

export interface ElectricityPaymentListResponse extends PaginatedResponse<ElectricityPaymentItem> {
  summary: {
    total_collected: number;
    total_payments: number;
  };
}

export interface ElectricityPaymentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "pending" | "paid" | "overdue" | "cancelled";
  month?: string;
  subscriber_id?: string;
  bill_id?: string;
}

export interface CreateElectricityPaymentInput {
  bill_id: string;
  amount: number;
  currency?: string;
  payment_date?: string;
  status?: "pending" | "paid" | "overdue" | "cancelled";
  received_by?: string | null;
  receipt_number?: string | null;
  notes?: string | null;
}

export interface ElectricitySubscriberLookupItem {
  id: string;
  subscription_number: string;
  client_name: string;
  is_active: boolean;
}

export interface CollectorLookupItem {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  access: unknown;
}

export interface OpenBillLookupItem {
  id: string;
  subscriber_id: string;
  subscriber_name: string;
  subscription_number: string;
  meter_number: string;
  month: string;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  currency: string;
  status: "pending" | "overdue" | "paid" | "cancelled";
}
