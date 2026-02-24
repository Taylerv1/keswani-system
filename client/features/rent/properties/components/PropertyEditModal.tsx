// ============================================================
// Property Module — Edit Modal
// ============================================================

import { Modal, LoadingLottie } from "@/components/ui";
import type { PropertyDto } from "../types";
import type { CreateUnitInput } from "../utils";
import { EMPTY_UNIT, parseOptionalInt, parseOptionalNumber } from "../utils";

type PropertyType = PropertyDto["type"];

interface PropertyEditModalProps {
  open: boolean;
  onClose: () => void;
  form: {
    name: string;
    type: PropertyType;
    address: string;
    city: string;
    ownerNotes: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      type: PropertyType;
      address: string;
      city: string;
      ownerNotes: string;
    }>
  >;
  units: CreateUnitInput[];
  setUnits: React.Dispatch<React.SetStateAction<CreateUnitInput[]>>;
  handleUnitTypeChange: (value: PropertyType) => void;
  onSave: () => void;
  actionLoading: boolean;
  t: (key: string) => string;
}

export function PropertyEditModal({
  open,
  onClose,
  form,
  setForm,
  units,
  setUnits,
  handleUnitTypeChange,
  onSave,
  actionLoading,
  t,
}: PropertyEditModalProps) {
  const updateUnit = <K extends keyof CreateUnitInput>(
    index: number,
    key: K,
    value: CreateUnitInput[K],
  ) => {
    setUnits((prev) =>
      prev.map((unit, i) => (i === index ? { ...unit, [key]: value } : unit)),
    );
  };

  const addUnit = () => {
    setUnits((prev) => [...prev, { ...EMPTY_UNIT }]);
  };

  const renderUnits = form.type === "house" ? units.slice(0, 1) : units;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("editProperty")}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("propertyName")}
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("propertyType")}
            </label>
            <select
              value={form.type === "commercial" ? "commercial" : form.type}
              onChange={(e) => handleUnitTypeChange(e.target.value as PropertyType)}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="building">{t("building")}</option>
              <option value="house">{t("house")}</option>
              <option value="land">{t("land")}</option>
              <option value="commercial">{t("commercial")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("city")}
            </label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("address")}
            </label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("priceNotes")}
            </label>
            <textarea
              value={form.ownerNotes}
              onChange={(e) =>
                setForm({ ...form, ownerNotes: e.target.value })
              }
              rows={3}
              className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>
        </div>

        {(form.type === "building" || form.type === "house") && (
          <div className="space-y-3 rounded-lg border border-surface-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-secondary">{t("units")}</p>
              {form.type === "building" && (
                <button
                  type="button"
                  onClick={addUnit}
                  className="h-9 px-3 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors"
                >
                  Add Unit
                </button>
              )}
            </div>

            {renderUnits.length === 0 ? (
              <div className="rounded-lg border border-surface-border bg-background p-3 text-sm text-text-secondary">
                {form.type === "house" ? (
                  <button
                    type="button"
                    onClick={addUnit}
                    className="h-9 px-3 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors"
                  >
                    Add Unit
                  </button>
                ) : (
                  t("noResults")
                )}
              </div>
            ) : (
              renderUnits.map((unit, index) => (
                <div key={unit.id ?? `${index}-${unit.unit_number}`} className="rounded-lg border border-surface-border bg-background p-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        {t("unitNumber")} #{index + 1}
                      </label>
                      <input
                        value={unit.unit_number ?? ""}
                        onChange={(e) => updateUnit(index, "unit_number", e.target.value)}
                        className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        {t("floor")}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={unit.floor ?? ""}
                        onChange={(e) => updateUnit(index, "floor", parseOptionalInt(e.target.value))}
                        className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        {t("bedrooms")}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={unit.bedrooms ?? ""}
                        onChange={(e) => updateUnit(index, "bedrooms", parseOptionalInt(e.target.value))}
                        className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        {t("bathrooms")}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={unit.bathrooms ?? ""}
                        onChange={(e) => updateUnit(index, "bathrooms", parseOptionalInt(e.target.value))}
                        className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        {t("area_sqm")}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={unit.area_sqm ?? ""}
                        onChange={(e) => updateUnit(index, "area_sqm", parseOptionalNumber(e.target.value))}
                        className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      {t("description")}
                    </label>
                    <textarea
                      value={unit.description ?? ""}
                      onChange={(e) => updateUnit(index, "description", e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onSave}
            disabled={actionLoading}
            className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center"
          >
            {actionLoading ? <LoadingLottie size={28} /> : t("save")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
