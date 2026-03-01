import { Modal } from "@/components/ui";
import type { RecordPaymentFormValues, RentPaymentItem } from "../types";
import { toNumber } from "../utils";

interface PaymentRecordModalProps {
  open: boolean;
  t: (key: string) => string;
  actionLoading: boolean;
  form: RecordPaymentFormValues | null;
  selectedPayment: RentPaymentItem | null;
  onClose: () => void;
  onSubmit: () => void;
  onChangeNotes: (notes: string) => void;
}

export function PaymentRecordModal({
  open,
  t,
  actionLoading,
  form,
  selectedPayment,
  onClose,
  onSubmit,
  onChangeNotes,
}: PaymentRecordModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("addPayment")}
      maxWidth="max-w-md"
    >
      {form && selectedPayment && (
        <div className="space-y-4">
          <div className="bg-background rounded-lg p-3">
            <p className="text-xs text-text-muted">{t("tenant")}</p>
            <p className="text-sm font-medium text-text-primary">
              {selectedPayment.client_name}
            </p>
          </div>

          <div className="bg-background rounded-lg p-3">
            <p className="text-xs text-text-muted">{t("amount")}</p>
            <p className="text-lg font-bold text-card-green">
              ${toNumber(selectedPayment.amount).toLocaleString()} {selectedPayment.currency}
            </p>
          </div>

          <p className="text-[11px] text-text-muted">
            {t("autoPaymentAndReceiptHint")}
          </p>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("notes")}
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => onChangeNotes(event.target.value)}
              className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={actionLoading}
              className="flex-1 h-10 rounded-lg bg-card-green text-white text-sm font-medium cursor-pointer border-0 hover:bg-card-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {actionLoading ? t("saving") : t("confirm")}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
