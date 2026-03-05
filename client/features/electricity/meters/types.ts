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

export interface MeterSubscriberSummary {
  id: string;
  subscription_number: string;
  is_active: boolean;
  client: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
  property: {
    id: string;
    name: string;
  } | null;
  unit: {
    id: string;
    unit_number: string;
  } | null;
}

export interface MeterListItem {
  id: string;
  meter_number: string;
  meter_type: "residential" | "commercial";
  status: "active" | "inactive";
  installation_date: string | null;
  last_reading_value: number | null;
  last_reading_date: string | null;
  created_at: string;
  updated_at: string;
  subscriber: MeterSubscriberSummary;
}

export interface MeterQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive";
  meter_type?: "residential" | "commercial";
  subscriber_id?: string;
}

export interface CreateMeterInput {
  subscriber_id: string;
  meter_number: string;
  meter_type: "residential" | "commercial";
  status: "active" | "inactive";
  installation_date?: string | null;
}

export interface UpdateMeterInput {
  subscriber_id?: string;
  meter_number?: string;
  meter_type?: "residential" | "commercial";
  status?: "active" | "inactive";
  installation_date?: string | null;
}

export interface SubscriberLookupItem {
  id: string;
  subscription_number: string;
  client_name: string;
  is_active: boolean;
}
