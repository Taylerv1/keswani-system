import { Modal } from "@/components/ui";
import type { ContractClientFormValues } from "../types";

interface ContractCreateTenantModalProps {
  open: boolean;
  t: (key: string) => string;
  actionLoading: boolean;
  form: ContractClientFormValues;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (next: ContractClientFormValues) => void;
}

export function ContractCreateTenantModal({
  open,
  t,
  actionLoading,
  form,
  onClose,
  onSubmit,
  onFormChange,
}: ContractCreateTenantModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("addTenant")}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t("tenantName")}
          </label>
          <input
            value={form.full_name}
            onChange={(e) =>
              onFormChange({
                ...form,
                full_name: e.target.value,
              })
            }
            className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("email")}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                onFormChange({
                  ...form,
                  email: e.target.value,
                })
              }
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("phone")}
            </label>
            <input
              value={form.phone}
              onChange={(e) =>
                onFormChange({
                  ...form,
                  phone: e.target.value,
                })
              }
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t("notes")}
          </label>
          <textarea
            value={form.notes}
            onChange={(e) =>
              onFormChange({
                ...form,
                notes: e.target.value,
              })
            }
            rows={4}
            className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={actionLoading}
            className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
