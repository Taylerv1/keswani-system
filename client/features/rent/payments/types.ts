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

export type PaymentStatus =
  | "pending"
  | "paid"
  | "partial"
  | "overdue"
  | "cancelled";

export type PaymentStatusFilter = "all" | PaymentStatus;
export type PaymentViewFilter = "all" | "queue" | "history";

export interface PaymentSummary {
  total_income: number;
  total_collected: number;
  total_outstanding: number;
}

export interface RentPaymentItem {
  id: string;
  contract_id: string;
  client_id: string;
  client_name: string;
  property_name: string;
  unit_number: string;
  amount: number | string;
  currency: string;
  // Due date (installment due date)
  payment_date: string;
  // Actual collected date (nullable if not paid yet)
  paid_at: string | null;
  period_start: string | null;
  period_end: string | null;
  status: PaymentStatus;
  received_by: string | null;
  receiver_name: string | null;
  receipt_number: string | null;
  manual_receipt_ref: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PaymentStatus;
  view?: PaymentViewFilter;
}

export interface PaymentListData extends PaginatedResponse<RentPaymentItem> {
  summary: PaymentSummary;
}

export interface UpdatePaymentInput {
  amount?: number;
  currency?: string;
  // Due date
  payment_date?: string;
  // Actual paid date
  paid_at?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  status?: PaymentStatus;
  receipt_number?: string | null;
  manual_receipt_ref?: string | null;
  notes?: string | null;
}

export interface RecordPaymentFormValues {
  paymentId: string;
  notes: string;
}
