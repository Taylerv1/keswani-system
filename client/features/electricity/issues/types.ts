export type IssueStatus   = "open" | "in_progress" | "resolved" | "closed";
export type IssuePriority = "low" | "medium" | "high";
export type IssueCategory = "billing" | "meter" | "connection" | "other";

export interface ElectricityIssue {
  id: string;
  subscriberId: string;
  subscriptionNumber: string;
  propertyName: string;
  unitNumber: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId: string | null;
  assigneeName: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendIssueItem {
  id: string;
  subscriber_id: string;
  subscription_number: string | null;
  property_name: string | null;
  unit_number: string | null;
  client_id: string;
  client_name: string | null;
  title: string;
  description: string | null;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  assigned_to: string | null;
  assignee_name: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueFormData {
  subscriberId: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  assignedTo: string;
}

export interface SubscriberLookup {
  id: string;
  subscriptionNumber: string;
  clientName: string;
  propertyName: string;
  unitNumber: string;
}

export interface EmployeeLookup {
  id: string;
  fullName: string;
}

export type TranslateFn = (key: string) => string;
