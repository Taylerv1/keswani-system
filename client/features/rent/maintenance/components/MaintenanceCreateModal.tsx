import type { Dispatch, SetStateAction } from "react";
import { LoadingLottie, Modal, SelectMenu } from "@/components/ui";
import type { MaintenanceFormData, MaintenanceRequest, PropertyLookup, Tenant, TranslateFn } from "../types";
import { useState } from "react";

interface MaintenanceCreateModalProps {
  open: boolean;
  onClose: () => void;
  form: MaintenanceFormData;
  setForm: Dispatch<SetStateAction<MaintenanceFormData>>;
  properties: PropertyLookup[];
  tenants: Tenant[];
  locale: string;
  onSave: () => void;
  error?: string;
  t: TranslateFn;
}

export function MaintenanceCreateModal({
  open,
  onClose,
  form,
  setForm,
  properties,
  tenants,
  locale,
  onSave,
  error,
  t,
}: MaintenanceCreateModalProps) {
  const selectedProperty = properties.find((property) => property.id === form.propertyId);
  const shouldShowUnitSelector = Boolean(
    form.propertyId &&
      selectedProperty &&
      selectedProperty.type !== "house" &&
      selectedProperty.units.length > 0
  );
  const [isSaving, setIsSaving] = useState(false);

  const findTenantByPropertyAndUnit = (propertyId: string, unitNumber: string) => {
    const normalizedUnit = unitNumber.trim().toLowerCase();
    if (!propertyId || !normalizedUnit) return undefined;
    return tenants.find(
      (tenant) =>
        tenant.propertyId === propertyId &&
        tenant.unitNumber.trim().toLowerCase() === normalizedUnit
    );
  };

  const handleTenantChange = (tenantId: string) => {
    setForm((prev) => {
      const selectedTenant = tenants.find((tenant) => tenant.id === tenantId);
      if (!selectedTenant || !selectedTenant.propertyId) {
        return { ...prev, tenantId };
      }

      const tenantProperty = properties.find(
        (property) => property.id === selectedTenant.propertyId
      );

      const nextUnitNumber =
        tenantProperty?.type === "house"
          ? tenantProperty.units[0]?.unit_number ?? selectedTenant.unitNumber
          : selectedTenant.unitNumber;

      return {
        ...prev,
        tenantId,
        propertyId: selectedTenant.propertyId,
        unitNumber: nextUnitNumber ?? "",
      };
    });
  };

  const handlePropertyChange = (propertyId: string) => {
    setForm((prev) => {
      const property = properties.find((item) => item.id === propertyId);
      if (!property) {
        return { ...prev, propertyId, unitNumber: "", tenantId: "" };
      }

      if (property.type === "house") {
        const houseUnitNumber = property.units[0]?.unit_number ?? "";
        const matchedTenant =
          findTenantByPropertyAndUnit(propertyId, houseUnitNumber) ??
          tenants.find((tenant) => tenant.propertyId === propertyId);

        return {
          ...prev,
          propertyId,
          unitNumber: houseUnitNumber,
          tenantId: matchedTenant?.id ?? "",
        };
      }

      return { ...prev, propertyId, unitNumber: "", tenantId: "" };
    });
  };

  const handleUnitChange = (unitNumber: string) => {
    setForm((prev) => {
      const matchedTenant = findTenantByPropertyAndUnit(prev.propertyId, unitNumber);
      return {
        ...prev,
        unitNumber,
        tenantId: matchedTenant?.id ?? "",
      };
    });
  };

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
      title={t("addMaintenanceRequest")}
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

        <div className={`grid grid-cols-1 ${shouldShowUnitSelector ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-4`}>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("property")}</label>
            <SelectMenu
              value={form.propertyId}
              onChange={handlePropertyChange}
              menuMaxHeight={190}
              options={properties.map((property) => ({
                value: property.id,
                label: property.name,
              }))}
              placeholder="--"
              searchable
              searchPlaceholder={`${t("search")}...`}
              noResultsLabel={t("noResults")}
            />
          </div>

          {shouldShowUnitSelector && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("unitNumber")}</label>
              <SelectMenu
                value={form.unitNumber}
                onChange={handleUnitChange}
                menuMaxHeight={190}
                options={
                  selectedProperty?.units.map((unit) => ({
                    value: unit.unit_number,
                    label: unit.unit_number,
                  })) ?? []
                }
                placeholder="--"
                noResultsLabel={t("noResults")}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("tenant")}</label>
            <SelectMenu
              value={form.tenantId}
              onChange={handleTenantChange}
              menuMaxHeight={190}
              options={tenants.map((tenant) => ({
                value: tenant.id,
                label: locale === "ar" ? tenant.nameAr : tenant.name,
              }))}
              placeholder="--"
              searchable
              searchPlaceholder={`${t("search")}...`}
              noResultsLabel={t("noResults")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("priority")}</label>
            <SelectMenu
              value={form.priority}
              onChange={(value) =>
                setForm({ ...form, priority: value as MaintenanceRequest["priority"] })
              }
              menuMaxHeight={190}
              options={[
                { value: "high", label: t("high") },
                { value: "medium", label: t("medium") },
                { value: "low", label: t("low") },
              ]}
              placeholder="--"
              noResultsLabel={t("noResults")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("status")}</label>
            <SelectMenu
              value={form.status}
              onChange={(value) =>
                setForm({ ...form, status: value as MaintenanceRequest["status"] })
              }
              menuMaxHeight={190}
              options={[
                { value: "open", label: t("open") },
                { value: "in_progress", label: t("inProgress") },
                { value: "completed", label: t("completed") },
                { value: "closed", label: t("closed") },
              ]}
              placeholder="--"
              noResultsLabel={t("noResults")}
            />
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
            className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center"
          >
            {isSaving ? <LoadingLottie size={28} /> : t("save")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
