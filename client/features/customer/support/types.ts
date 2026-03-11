export type {
  CustomerMaintenanceItem,
  MaintenanceStatus,
  MaintenancePriority,
  ApiResponse,
} from "../maintenance/types";

export type SupportTab = "rent" | "electricity";

export type IssueCategory = "billing" | "meter" | "connection" | "other";
export type IssueStatus = "open" | "in_progress" | "resolved" | "closed";
export type IssuePriority = "low" | "medium" | "high";

export interface CustomerElectricityIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  createdAt: string;
  updatedAt: string;
}

export interface BackendElectricityIssue {
  id: string;
  subscriber_id: string;
  title: string;
  description: string | null;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  created_at: string;
  updated_at: string;
}
