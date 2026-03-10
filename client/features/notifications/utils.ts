export const typeTranslationMap: Record<string, string> = {
  unpaid_bill: "unpaidBillAlert",
  unread_meter: "unreadMeterAlert",
  late_bill: "lateBillAlert",
  high_consumption: "highConsumptionAlert",
  faulty_meter: "faultyMeterAlert",
  electricity_issue: "electricityIssueAlert",
  late_payment: "latePaymentNotif",
  contract_ending: "contractEndingNotif",
  maintenance: "maintenanceNotif",
  vacant_property: "vacantPropertyNotif",
};

/**
 * Notification bodies may be stored as JSON `{ en: "...", ar: "..." }` for
 * bilingual support, or as a plain string (legacy / system-generated). This
 * helper returns the correct language variant, falling back to the raw string.
 */
export function parseNotificationMessage(message: string, locale: string): string {
  try {
    const parsed = JSON.parse(message) as Record<string, unknown>;
    if (parsed !== null && typeof parsed === "object") {
      if (locale === "ar" && typeof parsed.ar === "string") return parsed.ar;
      if (typeof parsed.en === "string") return parsed.en;
    }
  } catch {
    // not JSON — plain string
  }
  return message;
}
