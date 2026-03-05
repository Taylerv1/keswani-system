"use client";

import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
    isForRent: boolean;
    isForElectricity: boolean;
    address: string;
    city: string;
    ownerNotes: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      type: PropertyType;
      isForRent: boolean;
      isForElectricity: boolean;
      address: string;
      city: string;
      ownerNotes: string;
    }>
  >;
  units: CreateUnitInput[];
  setUnits: React.Dispatch<React.SetStateAction<CreateUnitInput[]>>;
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
  onSave,
  actionLoading,
  t,
}: PropertyEditModalProps) {
  const [expandedUnitKeys, setExpandedUnitKeys] = useState<Record<string, boolean>>({});
  const unitsEndRef = useRef<HTMLDivElement | null>(null);

  const renderUnits = form.type === "house" ? units.slice(0, 1) : units;

  const getUnitKey = (unit: CreateUnitInput, index: number): string => {
    return unit.id ?? `edit-${index}-${unit.unit_number || "unit"}`;
  };

  useEffect(() => {
    if (!open) return;

    setExpandedUnitKeys((prev) => {
      const next: Record<string, boolean> = {};

      renderUnits.forEach((unit, index) => {
        const key = getUnitKey(unit, index);
        next[key] = prev[key] ?? index === 0;
      });

      if (form.type === "house" && renderUnits.length === 0) {
        next.house_unit = prev.house_unit ?? true;
      }

      return next;
    });
  }, [open, form.type, units]);

  const toggleUnit = (key: string) => {
    setExpandedUnitKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const scrollToUnitsEnd = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        unitsEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });
    });
  };

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
    scrollToUnitsEnd();
  };

  const removeUnit = (index: number) => {
    setUnits((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("editProperty")}
      maxWidth="max-w-xl"
      showClose={!actionLoading}
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
              {t("address")}
            </label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-surface-border p-3">
          <label className="flex items-center gap-3 text-sm text-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={form.isForRent}
              onChange={(e) =>
                setForm((prev) => {
                  const nextValue = e.target.checked;
                  if (!nextValue && !prev.isForElectricity) return prev;
                  return { ...prev, isForRent: nextValue };
                })
              }
              className="h-4 w-4 rounded border-surface-border"
            />
            {t("rent")}
          </label>
          <label className="flex items-center gap-3 text-sm text-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={form.isForElectricity}
              onChange={(e) =>
                setForm((prev) => {
                  const nextValue = e.target.checked;
                  if (!nextValue && !prev.isForRent) return prev;
                  return { ...prev, isForElectricity: nextValue };
                })
              }
              className="h-4 w-4 rounded border-surface-border"
            />
            {t("electricity")}
          </label>
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

        {(form.type === "building" || form.type === "house") && (
          <div className="space-y-3 rounded-xl border border-surface-border bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-text-secondary">{t("units")}</p>

              {form.type === "building" && (
                <button
                  type="button"
                  onClick={addUnit}
                  className="h-9 px-3 rounded-lg border border-surface-border bg-background text-text-secondary text-sm font-medium cursor-pointer hover:bg-surface transition-colors inline-flex items-center gap-1"
                >
                  <Plus size={14} />
                  {t("addUnit")}
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
                    {t("addUnit")}
                  </button>
                ) : (
                  t("noResults")
                )}
              </div>
            ) : (
              renderUnits.map((unit, index) => {
                const unitKey = getUnitKey(unit, index);
                const expanded = expandedUnitKeys[unitKey] ?? false;

                return (
                  <div
                    key={unitKey}
                    className="rounded-lg border border-surface-border bg-background"
                  >
                    <div className="px-3 py-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleUnit(unitKey)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-text-primary cursor-pointer"
                      >
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {form.type === "house"
                          ? t("propertyDetails")
                          : `${t("unitNumber")} #${index + 1}`}
                      </button>

                      <div className="flex items-center gap-2">
                        {form.type === "building" && (
                          <span className="text-xs px-2 py-1 rounded-full bg-surface border border-surface-border text-text-secondary">
                            {unit.unit_number || "-"}
                          </span>
                        )}

                        {form.type === "building" && (
                          <button
                            type="button"
                            onClick={() => removeUnit(index)}
                            className="h-8 px-2 rounded-lg border border-surface-border text-text-secondary hover:text-card-red hover:border-card-red transition-colors text-xs font-medium cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 size={13} />
                            {t("delete")}
                          </button>
                        )}
                      </div>
                    </div>

                    {expanded && (
                      <div className="px-3 pb-3 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {form.type === "building" && (
                            <div>
                              <label className="block text-sm font-medium text-text-secondary mb-1">
                                {t("unitNumber")}
                              </label>
                              <input
                                value={unit.unit_number ?? ""}
                                onChange={(e) => updateUnit(index, "unit_number", e.target.value)}
                                className="w-full h-10 rounded-lg border border-surface-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">
                              {t("floor")}
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={unit.floor ?? ""}
                              onChange={(e) => updateUnit(index, "floor", parseOptionalInt(e.target.value))}
                              className="w-full h-10 rounded-lg border border-surface-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                              className="w-full h-10 rounded-lg border border-surface-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                              className="w-full h-10 rounded-lg border border-surface-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                              className="w-full h-10 rounded-lg border border-surface-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <div ref={unitsEndRef} />
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
