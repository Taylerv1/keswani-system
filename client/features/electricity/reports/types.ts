export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ReportSummary {
  total_consumption: number;
  total_billed: number;
  total_paid: number;
  total_outstanding: number;
  collection_rate: number;
}

export interface ConsumptionByMonthItem {
  month: string;
  consumption_kwh: number;
  bills_count: number;
}

export interface RevenueByMonthItem {
  month: string;
  billed_amount: number;
  collected_amount: number;
}

export interface BuildingBreakdownItem {
  property_id: string;
  property_name: string;
  total_subscribers: number;
  total_consumption: number;
  total_revenue: number;
}

export interface SubscriberBreakdownItem {
  subscriber_id: string;
  subscriber_name: string;
  subscription_number: string;
  total_consumption: number;
  total_billed: number;
  total_paid: number;
  total_outstanding: number;
}

export interface ElectricityReportsResponse {
  range: {
    from_month: string | null;
    to_month: string | null;
  };
  summary: ReportSummary;
  consumption_by_month: ConsumptionByMonthItem[];
  revenue_by_month: RevenueByMonthItem[];
  building_breakdown: BuildingBreakdownItem[];
  subscriber_breakdown: SubscriberBreakdownItem[];
}

export interface ElectricityReportsQueryParams {
  from_month?: string;
  to_month?: string;
}

export type ElectricityReportType =
  | "consumption"
  | "revenue"
  | "debt"
  | "building"
  | "subscriber";
