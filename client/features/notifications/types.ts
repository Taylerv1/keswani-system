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

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export type TabFilter = "all" | "rent" | "electricity";
export type ReadFilter = "all" | "unread" | "read";

export interface MaintenanceDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  property_name: string | null;
  unit_number: string | null;
  requester_name: string | null;
  assignee_name: string | null;
  estimated_cost: string | number | null;
  created_at: string;
  updated_at: string;
}

export interface IssueDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  client_name: string | null;
  subscription_number: string | null;
  property_name: string | null;
  unit_number: string | null;
  assignee_name: string | null;
  created_at: string;
  resolved_at: string | null;
}

export type RentNotificationType =
  | "late_payment"
  | "contract_ending"
  | "maintenance"
  | "vacant_property";

export type ElectricityNotificationType =
  | "unpaid_bill"
  | "unread_meter"
  | "late_bill"
  | "high_consumption"
  | "faulty_meter"
  | "electricity_issue";

export type NotificationTypeFilter = "all" | RentNotificationType | ElectricityNotificationType;
