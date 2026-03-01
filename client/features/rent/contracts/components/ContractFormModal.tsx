import { Modal, SelectMenu, type SelectOption } from "@/components/ui";
import type { ContractFormValues, PropertyLookupItem } from "../types";

interface ContractFormModalProps {
  open: boolean;
  t: (key: string) => string;
  actionLoading: boolean;
  form: ContractFormValues;
  tenantOptions: SelectOption[];
  propertyOptions: SelectOption[];
  selectedPropertyUnits: PropertyLookupItem["units"];
  isHouseProperty: boolean;
  contractStatusOptions: SelectOption[];
  onClose: () => void;
  onSave: () => void;
  onOpenCreateTenant: () => void;
  onFormChange: (next: ContractFormValues) => void;
  onPropertyChange: (propertyId: string) => void;
}

export function ContractFormModal({
  open,
  t,
  actionLoading,
  form,
  tenantOptions,
  propertyOptions,
  selectedPropertyUnits,
  isHouseProperty,
  contractStatusOptions,
  onClose,
  onSave,
  onOpenCreateTenant,
  onFormChange,
  onPropertyChange,
}: ContractFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={t("addContract")} maxWidth="max-w-xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("tenant")}</label>
            <SelectMenu
              value={form.client_id}
              options={tenantOptions}
              onChange={(value) => onFormChange({ ...form, client_id: value })}
              placeholder="--"
              searchable
              searchPlaceholder={`${t("search")}...`}
              noResultsLabel={t("noResults")}
              addActionLabel={t("addTenant")}
              onAddAction={onOpenCreateTenant}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("property")}</label>
            <SelectMenu
              value={form.property_id}
              options={propertyOptions}
              onChange={onPropertyChange}
              placeholder="--"
              searchable
              searchPlaceholder={`${t("search")}...`}
              noResultsLabel={t("noResults")}
            />
          </div>
        </div>

        <div className={`grid grid-cols-1 ${isHouseProperty ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-4`}>
          {!isHouseProperty && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("unitNumber")}</label>
              <SelectMenu
                value={form.unit_id}
                onChange={(value) => onFormChange({ ...form, unit_id: value })}
                options={selectedPropertyUnits.map((unit) => ({
                  value: unit.id,
                  label: unit.unit_number,
                }))}
                placeholder="--"
                noResultsLabel={t("noResults")}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("startDate")}</label>
            <input type="date" value={form.start_date} onChange={(e) => onFormChange({ ...form, start_date: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("endDate")}</label>
            <input type="date" value={form.end_date} onChange={(e) => onFormChange({ ...form, end_date: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("monthlyRent")}</label>
            <input type="number" min={0} value={form.monthly_rent} onChange={(e) => onFormChange({ ...form, monthly_rent: +e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("deposit")}</label>
            <input type="number" min={0} value={form.deposit_amount} onChange={(e) => onFormChange({ ...form, deposit_amount: +e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("status")}</label>
            <SelectMenu
              value={form.status}
              onChange={(value) =>
                onFormChange({
                  ...form,
                  status: value as "pending" | "active" | "expired" | "terminated",
                })
              }
              options={contractStatusOptions}
              placeholder="--"
              noResultsLabel={t("noResults")}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t("notes")}</label>
          <textarea value={form.notes} onChange={(e) => onFormChange({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors">{t("cancel")}</button>
          <button disabled={actionLoading} onClick={onSave} className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed">{actionLoading ? t("loading") : t("save")}</button>
        </div>
      </div>
    </Modal>
  );
}
