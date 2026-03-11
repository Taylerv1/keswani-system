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

export interface SubscriberClient {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
}

export interface SubscriberProperty {
  id: string;
  name: string;
}

export interface SubscriberUnit {
  id: string;
  unit_number: string;
}

export interface SubscriberListItem {
  id: string;
  subscription_number: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client: SubscriberClient;
  property: SubscriberProperty | null;
  unit: SubscriberUnit | null;
  meters_count: number;
  last_reading_date: string | null;
}

export interface SubscriberMeter {
  id: string;
  meter_number: string;
  meter_type: "residential" | "commercial";
  is_active: boolean;
  installation_date: string | null;
  last_reading_value: number | null;
  last_reading_date: string | null;
}

export interface SubscriberReading {
  id: string;
  meter_id: string;
  meter_number: string;
  reading_value: number;
  reading_date: string;
  source: "manual" | "automatic";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriberBill {
  id: string;
  billing_period_start: string;
  billing_period_end: string;
  previous_reading: number;
  current_reading: number;
  consumption_kwh: number;
  price_per_kwh: number;
  total_amount: number;
  currency: string;
  status: string;
  meter_id: string;
  meter_number: string;
  paid_amount: number;
  outstanding_amount: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriberPayment {
  id: string;
  bill_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string;
  status: string;
  receipt_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriberDetail {
  id: string;
  subscription_number: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client: SubscriberClient & {
    address: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  property: SubscriberProperty | null;
  unit: SubscriberUnit | null;
  meters: SubscriberMeter[];
  readings: SubscriberReading[];
  bills: SubscriberBill[];
  payments: SubscriberPayment[];
  summary: {
    total_billed: number;
    total_paid: number;
    outstanding_balance: number;
  };
}

export interface SubscriberQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive";
}

export interface CreateSubscriberInput {
  full_name: string;
  email?: string;
  phone?: string;
  subscription_number: string;
  property_id?: string | null;
  unit_id?: string | null;
  is_active?: boolean;
  notes?: string;
}

export interface UpdateSubscriberInput {
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  subscription_number?: string;
  property_id?: string | null;
  unit_id?: string | null;
  is_active?: boolean;
  notes?: string | null;
}

export interface InviteAccessResponse {
  client_id: string;
  email: string;
  auth_user_id: string;
  delivery?: "invite" | "reset";
}

export interface PropertyLookup {
  id: string;
  name: string;
  units: Array<{
    id: string;
    unit_number: string;
  }>;
}
