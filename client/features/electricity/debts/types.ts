export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface DebtBillItem {
  bill_id: string;
  month: string;
  meter_number: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
}

export interface DebtSubscriberItem {
  subscriber_id: string;
  subscriber_name: string;
  subscription_number: string;
  subscriber_email: string | null;
  subscriber_phone: string | null;
  property: { id: string; name: string } | null;
  unit: { id: string; unit_number: string } | null;
  total_debt: number;
  unpaid_bills: number;
  last_payment_date: string | null;
  bills: DebtBillItem[];
}

export interface ElectricityDebtsResponse {
  summary: {
    total_debt: number;
    total_unpaid_bills: number;
    subscribers_in_debt: number;
  };
  items: DebtSubscriberItem[];
}
