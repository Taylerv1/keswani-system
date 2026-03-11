import type { ContractListItem } from "../contracts/types";
import type { ContractNotificationDetail, NotificationItem } from "./types";

export const PAGE_SIZE = 8;

const DETAIL_SUPPORTED_TYPES = new Set([
  "late_payment",
  "contract_ending",
  "maintenance",
]);

export function isNotificationDetailSupported(item: NotificationItem): boolean {
  return Boolean(item.relatedId) && DETAIL_SUPPORTED_TYPES.has(item.type);
}

export function isTenantRelatedType(relatedType: string | null): boolean {
  const normalized = (relatedType ?? "").trim().toLowerCase();
  return (
    normalized === "client" ||
    normalized === "clients" ||
    normalized === "tenant" ||
    normalized === "tenants"
  );
}

export function mapContractStatus(status: string): ContractListItem["status"] {
  if (
    status === "pending" ||
    status === "active" ||
    status === "expired" ||
    status === "terminated"
  ) {
    return status;
  }
  return "pending";
}

export function mapContractDetailToListItem(
  detail: ContractNotificationDetail
): ContractListItem {
  return {
    id: detail.id,
    unit_id: detail.unit_id,
    unit_number: detail.unit.unit_number,
    property_id: detail.unit.property_id,
    property_name: detail.unit.property.name,
    client_id: detail.client_id,
    client_name: detail.client.full_name,
    start_date: detail.start_date,
    end_date: detail.end_date,
    monthly_rent: detail.monthly_rent,
    currency: detail.currency,
    deposit_amount: detail.deposit_amount,
    status: mapContractStatus(detail.status),
    notes: detail.notes,
    created_at: detail.created_at,
    updated_at: detail.updated_at,
  };
}

export function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeMaintenancePriority(priority: string): string {
  const normalized = priority.trim().toLowerCase();
  if (normalized === "critical" || normalized === "urgent") return "high";
  return normalized || "medium";
}

export function formatDateValue(value: string | null | undefined, locale: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(locale === "ar" ? "ar" : "en-US");
}

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}
