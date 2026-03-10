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

export interface BillPaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  payment_date: string | null;
  status: "pending" | "paid" | "overdue" | "cancelled";
  payment_method: string;
  received_by: string | null;
  collector_name: string | null;
  receipt_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface BillListItem {
  id: string;
  meter_id: string;
  meter_number: string;
  subscriber_id: string;
  subscriber_name: string;
  subscription_number: string;
  subscriber_email: string | null;
  subscriber_phone: string | null;
  property: { id: string; name: string } | null;
  unit: { id: string; unit_number: string } | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  month: string;
  due_date: string | null;
  previous_reading: number;
  current_reading: number;
  consumption_kwh: number;
  price_per_kwh: number;
  total_amount: number;
  currency: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  paid_amount: number;
  outstanding_amount: number;
  payment_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillDetailItem extends BillListItem {
  generated_by: string | null;
  generated_by_name: string | null;
  payments: BillPaymentHistoryItem[];
}

export interface BillQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "pending" | "paid" | "overdue" | "cancelled" | "open";
  month?: string;
  subscriber_id?: string;
  meter_id?: string;
}

export interface BillListResponse extends PaginatedResponse<BillListItem> {
  meta?: {
    available_months?: string[];
  };
}
