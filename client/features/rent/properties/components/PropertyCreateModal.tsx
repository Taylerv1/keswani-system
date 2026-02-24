// ============================================================
// Property Module — Create Modal (includes unit sub-modal)
// ============================================================

import { Modal, LoadingLottie } from "@/components/ui";
import type { PropertyDto } from "../types";
import type { CreateUnitInput } from "../utils";
import { EMPTY_UNIT, parseOptionalInt, parseOptionalNumber } from "../utils";

type PropertyType = PropertyDto["type"];

interface PropertyCreateModalProps {
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
  unitDraft: CreateUnitInput;
  setUnitDraft: React.Dispatch<React.SetStateAction<CreateUnitInput>>;
  unitModalOpen: boolean;
  setUnitModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleUnitTypeChange: (value: PropertyType) => void;
  updateHouseUnit: <K extends keyof CreateUnitInput>(
    key: K,
    value: CreateUnitInput[K]
  ) => void;
  addBuildingUnit: () => void;
  onSave: () => void;
  actionLoading: boolean;
  t: (key: string) => string;
}

export function PropertyCreateModal({
  open,
  onClose,
  form,
  setForm,
  units,
  unitDraft,
  setUnitDraft,
  unitModalOpen,
  setUnitModalOpen,
  handleUnitTypeChange,
  updateHouseUnit,
  addBuildingUnit,
  onSave,
  actionLoading,
  t,
}: PropertyCreateModalProps) {
  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={t("addProperty")}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("propertyType")}
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  handleUnitTypeChange(e.target.value as PropertyType)
                }
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="building">{t("building")}</option>
                <option value="house">{t("house")}</option>
              </select>
            </div>
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

          {/* Building units section */}
          {form.type === "building" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-text-secondary">
                  {t("units")}
                </label>
                <button
                  onClick={() => {
                    setUnitDraft(EMPTY_UNIT);
                    setUnitModalOpen(true);
                  }}
                  type="button"
                  className="h-9 px-3 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors"
                >
                  Add Unit
                </button>
              </div>
              <div className="rounded-lg border border-surface-border bg-background p-3 text-sm text-text-secondary">
                {units.length === 0
                  ? t("noResults")
                  : `${units.length} ${t("units")}`}
              </div>
            </div>
          ) : form.type === "house" ? (
            /* House details inline form */
            <div className="space-y-3 rounded-lg border border-surface-border p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    {t("floor")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={units[0]?.floor ?? ""}
                    onChange={(e) =>
                      updateHouseUnit("floor", parseOptionalInt(e.target.value))
                    }
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
                    value={units[0]?.bedrooms ?? ""}
                    onChange={(e) =>
                      updateHouseUnit(
                        "bedrooms",
                        parseOptionalInt(e.target.value)
                      )
                    }
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
                    value={units[0]?.bathrooms ?? ""}
                    onChange={(e) =>
                      updateHouseUnit(
                        "bathrooms",
                        parseOptionalInt(e.target.value)
                      )
                    }
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
                    value={units[0]?.area_sqm ?? ""}
                    onChange={(e) =>
                      updateHouseUnit(
                        "area_sqm",
                        parseOptionalNumber(e.target.value)
                      )
                    }
                    className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t("description")}
                </label>
                <textarea
                  value={units[0]?.description ?? ""}
                  onChange={(e) =>
                    updateHouseUnit("description", e.target.value)
                  }
                  rows={3}
                  className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>
          ) : null}

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

      {/* Sub-modal: Add building unit */}
      <Modal
        open={unitModalOpen}
        onClose={() => setUnitModalOpen(false)}
        title="Add Unit"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("unitNumber")}
              </label>
              <input
                value={unitDraft.unit_number}
                onChange={(e) =>
                  setUnitDraft({ ...unitDraft, unit_number: e.target.value })
                }
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
                value={unitDraft.floor ?? ""}
                onChange={(e) =>
                  setUnitDraft({
                    ...unitDraft,
                    floor: parseOptionalInt(e.target.value),
                  })
                }
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
                value={unitDraft.bedrooms ?? ""}
                onChange={(e) =>
                  setUnitDraft({
                    ...unitDraft,
                    bedrooms: parseOptionalInt(e.target.value),
                  })
                }
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
                value={unitDraft.bathrooms ?? ""}
                onChange={(e) =>
                  setUnitDraft({
                    ...unitDraft,
                    bathrooms: parseOptionalInt(e.target.value),
                  })
                }
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
                value={unitDraft.area_sqm ?? ""}
                onChange={(e) =>
                  setUnitDraft({
                    ...unitDraft,
                    area_sqm: parseOptionalNumber(e.target.value),
                  })
                }
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("description")}
            </label>
            <textarea
              value={unitDraft.description ?? ""}
              onChange={(e) =>
                setUnitDraft({ ...unitDraft, description: e.target.value })
              }
              rows={3}
              className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setUnitModalOpen(false)}
              className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={addBuildingUnit}
              className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
            >
              {t("add")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
