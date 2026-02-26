import type { Dispatch, SetStateAction } from "react";
import { Modal } from "@/components/ui";
import type { MaintenanceFormData, MaintenanceRequest, PropertyLookup, Tenant, TranslateFn } from "../types";
import { useState } from "react";

interface MaintenanceFormModalProps {
  open: boolean;
  onClose: () => void;
  editItem: MaintenanceRequest | null;
  form: MaintenanceFormData;
  setForm: Dispatch<SetStateAction<MaintenanceFormData>>;
  properties: PropertyLookup[];
  tenants: Tenant[];
  locale: string;
  onSave: () => void;
  error?: string;
  t: TranslateFn;
}

export function MaintenanceFormModal({
  open,
  onClose,
  editItem,
  form,
  setForm,
  properties,
  tenants,
  locale,
  onSave,
  error,
  t,
}: MaintenanceFormModalProps) {
  const selectedProperty = properties.find((property) => property.id === form.propertyId);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveClick = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      await Promise.resolve(onSave());
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editItem ? t("editMaintenanceRequest") : t("addMaintenanceRequest")}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t("maintenanceTitle")}</label>
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t("description")}</label>
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            rows={2}
            className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("property")}</label>
            <select
              value={form.propertyId}
              onChange={(event) =>
                setForm({ ...form, propertyId: event.target.value, unitNumber: "" })
              }
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">--</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("unitNumber")}</label>
            <select
              value={form.unitNumber}
              onChange={(event) => setForm({ ...form, unitNumber: event.target.value })}
              disabled={!selectedProperty}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">--</option>
              {selectedProperty?.units.map((unit) => (
                <option key={unit.id} value={unit.unit_number}>
                  {unit.unit_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("tenant")}</label>
            <select
              value={form.tenantId}
              onChange={(event) => setForm({ ...form, tenantId: event.target.value })}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">--</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {locale === "ar" ? tenant.nameAr : tenant.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("priority")}</label>
            <select
              value={form.priority}
              onChange={(event) =>
                setForm({ ...form, priority: event.target.value as MaintenanceRequest["priority"] })
              }
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="high">{t("high")}</option>
              <option value="medium">{t("medium")}</option>
              <option value="low">{t("low")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("status")}</label>
            <select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as MaintenanceRequest["status"] })
              }
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="open">{t("open")}</option>
              <option value="in_progress">{t("inProgress")}</option>
              <option value="completed">{t("completed")}</option>
              <option value="closed">{t("closed")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("maintenanceCost")}</label>
            <input
              type="number"
              min={0}
              value={form.cost ?? ""}
              onChange={(event) =>
                setForm({ ...form, cost: event.target.value ? +event.target.value : null })
              }
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {t("cancel")}
          </button>

          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isSaving && (
              <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
            )}
            {isSaving ? t("loading") : t("save")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
