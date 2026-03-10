import type {
  BackendIssueItem,
  ElectricityIssue,
  IssueCategory,
  IssueFormData,
  IssuePriority,
  IssueStatus,
} from "./types";

export function mapBackendIssue(item: BackendIssueItem): ElectricityIssue {
  return {
    id: item.id,
    subscriberId: item.subscriber_id,
    subscriptionNumber: item.subscription_number ?? "",
    propertyName: item.property_name ?? "",
    unitNumber: item.unit_number ?? "",
    clientId: item.client_id,
    clientName: item.client_name ?? "",
    title: item.title,
    description: item.description ?? "",
    category: item.category,
    status: item.status,
    priority: item.priority,
    assigneeId: item.assigned_to,
    assigneeName: item.assignee_name ?? "",
    resolvedAt: item.resolved_at,
    createdAt: item.created_at.split("T")[0] ?? item.created_at,
    updatedAt: item.updated_at.split("T")[0] ?? item.updated_at,
  };
}

export function createEmptyForm(): IssueFormData {
  return {
    subscriberId: "",
    title: "",
    description: "",
    category: "other",
    priority: "medium",
    status: "open",
    assignedTo: "",
  };
}

export function getPriorityColor(priority: IssuePriority): string {
  switch (priority) {
    case "high":
      return "bg-card-red";
    case "medium":
      return "bg-card-orange";
    case "low":
      return "bg-card-blue";
    default:
      return "bg-card-blue";
  }
}

export function getCategoryTranslationKey(category: IssueCategory): string {
  switch (category) {
    case "billing":
      return "issueCategoryBilling";
    case "meter":
      return "issueCategoryMeter";
    case "connection":
      return "issueCategoryConnection";
    case "other":
      return "issueCategoryOther";
    default:
      return "issueCategoryOther";
  }
}

export function getStatusTranslationKey(status: IssueStatus): string {
  switch (status) {
    case "open":
      return "issueStatusOpen";
    case "in_progress":
      return "issueStatusInProgress";
    case "resolved":
      return "issueStatusResolved";
    case "closed":
      return "issueStatusClosed";
    default:
      return "issueStatusOpen";
  }
}

export function getPriorityTranslationKey(priority: IssuePriority): string {
  switch (priority) {
    case "high":
      return "issuePriorityHigh";
    case "medium":
      return "issuePriorityMedium";
    case "low":
      return "issuePriorityLow";
    default:
      return "issuePriorityMedium";
  }
}
