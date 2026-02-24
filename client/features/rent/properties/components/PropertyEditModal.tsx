// ============================================================
// Property Module — Edit Modal
// ============================================================

import { Modal, LoadingLottie } from "@/components/ui";
import type { PropertyDto } from "../types";

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
  onSave: () => void;
  actionLoading: boolean;
  t: (key: string) => string;
}

export function PropertyEditModal({
  open,
  onClose,
  form,
  setForm,
  onSave,
  actionLoading,
  t,
}: PropertyEditModalProps) {
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
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as PropertyType })
              }
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
