import { StatusBadge } from "@/components/ui";
import type { RentPaymentItem } from "../types";
import { canRecordCashPayment, getPaymentPeriodLabel, toNumber } from "../utils";

interface PaymentMobileCardProps {
  payment: RentPaymentItem;
  t: (key: string) => string;
  onRecordPayment: (paymentId: string) => void;
}

export function PaymentMobileCard({
  payment,
  t,
  onRecordPayment,
}: PaymentMobileCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-surface-border p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-text-primary">
          {payment.client_name}
        </span>
        <StatusBadge status={payment.status} />
      </div>

      <p className="text-xs text-text-secondary mb-2">
        {payment.property_name} - {payment.unit_number}
      </p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-2">
        <div>
          <span className="text-text-muted">{t("month")}: </span>
          <span className="text-text-secondary">
            {getPaymentPeriodLabel(payment)}
          </span>
        </div>
        <div>
          <span className="text-text-muted">{t("amount")}: </span>
          <span className="font-medium text-text-primary">
            ${toNumber(payment.amount).toLocaleString()} {payment.currency}
          </span>
        </div>
        <div>
          <span className="text-text-muted">{t("dueDate")}: </span>
          <span className="text-text-secondary">
            {payment.payment_date ? payment.payment_date.slice(0, 10) : "-"}
          </span>
        </div>
        <div>
          <span className="text-text-muted">{t("paymentDate")}: </span>
          <span className="text-text-secondary">
            {payment.paid_at ? payment.paid_at.slice(0, 10) : "-"}
          </span>
        </div>
      </div>

      {payment.receipt_number && (
        <p className="text-[11px] text-text-muted mb-2">
          {t("receiptNumber")}: {payment.receipt_number}
        </p>
      )}

      {canRecordCashPayment(payment.status) && (
        <button
          type="button"
          onClick={() => onRecordPayment(payment.id)}
          className="w-full h-8 mt-1 rounded-lg bg-card-green text-white text-xs font-medium cursor-pointer border-0 hover:bg-card-green/90 transition-colors"
        >
          {t("addPayment")}
        </button>
      )}
    </div>
  );
}
