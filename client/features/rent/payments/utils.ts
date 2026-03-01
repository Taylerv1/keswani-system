import type { PaymentStatus, RentPaymentItem } from "./types";

export const PAGE_SIZE = 10;

export function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

export function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getPaymentPeriodLabel(payment: RentPaymentItem): string {
  const from = payment.period_start ?? payment.payment_date;
  if (!from) return "-";
  return from.slice(0, 7);
}

export function canRecordCashPayment(status: PaymentStatus): boolean {
  return status === "pending" || status === "overdue" || status === "partial";
}
