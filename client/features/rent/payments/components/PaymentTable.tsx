import { StatusBadge } from "@/components/ui";
import type { PaymentStatus, RentPaymentItem } from "../types";
import { canRecordCashPayment, getPaymentPeriodLabel, toNumber } from "../utils";

interface PaymentTableProps {
  payments: RentPaymentItem[];
  t: (key: string) => string;
  onRecordPayment: (paymentId: string) => void;
}

export function PaymentTable({
  payments,
  t,
  onRecordPayment,
}: PaymentTableProps) {
  return (
    <div className="hidden @3xl:block bg-surface rounded-xl border border-surface-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-background">
              <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                {t("tenant")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                {t("property")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                {t("month")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                {t("amount")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                {t("dueDate")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                {t("paymentDate")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                {t("receiptNumber")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                {t("status")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-text-muted">
                  {t("noResults")}
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {payment.client_name}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {payment.property_name} - {payment.unit_number}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {getPaymentPeriodLabel(payment)}
                  </td>
                  <td className="px-4 py-3 font-medium text-text-primary">
                    ${toNumber(payment.amount).toLocaleString()} {payment.currency}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {payment.payment_date ? payment.payment_date.slice(0, 10) : "-"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {payment.paid_at ? payment.paid_at.slice(0, 10) : "-"}
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {payment.receipt_number || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={payment.status as PaymentStatus} />
                  </td>
                  <td className="px-4 py-3">
                    {canRecordCashPayment(payment.status) && (
                      <button
                        type="button"
                        onClick={() => onRecordPayment(payment.id)}
                        className="h-8 px-3 rounded-lg bg-card-green text-white text-xs font-medium cursor-pointer border-0 hover:bg-card-green/90 transition-colors"
                      >
                        {t("addPayment")}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
