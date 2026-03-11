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

export interface ReadingListItem {
  id: string;
  meter_id: string;
  meter_number: string;
  subscriber_id: string;
  subscriber_name: string;
  subscription_number: string;
  previous_reading: number;
  current_reading: number;
  consumption: number;
  reading_date: string | null;
  month: string;
  recorded_by: string | null;
  recorded_by_name: string | null;
  source: "manual" | "automatic";
  notes: string | null;
  bill_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReadingQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  month?: string;
  meter_id?: string;
}

export interface CreateReadingInput {
  meter_id: string;
  reading_value: number;
  reading_date?: string;
  recorded_by?: string | null;
  source?: "manual" | "automatic";
  notes?: string | null;
}

export interface MeterLookupItem {
  id: string;
  meter_number: string;
  status: "active" | "inactive";
  last_reading_value: number | null;
  last_reading_date: string | null;
  subscriber: {
    id: string;
    subscription_number: string;
    client: {
      full_name: string;
    };
  };
}

export interface EmployeeLookupItem {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  access: unknown;
}

export interface GenerateBillResponse {
  id: string;
  meter_id: string;
  meter_number: string;
  subscriber_id: string;
  billing_period_start: string | null;
  billing_period_end: string | null;
  previous_reading: number;
  current_reading: number;
  consumption_kwh: number;
  price_per_kwh: number;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
}
