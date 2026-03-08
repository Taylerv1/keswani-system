"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import { LoadingLottie, Modal } from "@/components/ui";
import { pricingStore } from "@/stores/pricingStore";
import type { PricingPlan, PricingPlanPayload } from "@/services/pricingService";

interface PricingFormProps {
  open: boolean;
  editingPlan: PricingPlan | null;
  onClose: () => void;
}

function parseFeatures(value: string): string[] {
  return value
    .split("\n")
    .map((feature) => feature.trim())
    .filter(Boolean);
}

function createInitialForm(editingPlan: PricingPlan | null) {
  if (!editingPlan) {
    return {
      name: "",
      price: 0,
      description: "",
      features: "",
    };
  }

  return {
    name: editingPlan.name,
    price: editingPlan.price,
    description: editingPlan.description,
    features: (editingPlan.features ?? []).join("\n"),
  };
}

function PricingFormComponent({ open, editingPlan, onClose }: PricingFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => createInitialForm(editingPlan));
  const isEditing = Boolean(editingPlan);

  const handleSubmit = async () => {
    const payload: PricingPlanPayload = {
      name: form.name.trim(),
      // Keep price immutable when editing an existing pricing plan.
      price: editingPlan ? editingPlan.price : form.price,
      description: form.description.trim(),
      features: parseFeatures(form.features),
    };

    setSaving(true);

    const result = editingPlan
      ? await pricingStore.updatePlan(editingPlan.id, payload)
      : await pricingStore.createPlan(payload);

    setSaving(false);

    if (result) {
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingPlan ? "Edit Pricing" : "Add Pricing"}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Plan Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Price ($)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            disabled={isEditing}
            className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-surface"
          />
          {isEditing && (
            <p className="mt-1 text-xs text-text-muted">Price cannot be changed while editing a plan.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full min-h-24 rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Features (one per line)
          </label>
          <textarea
            value={form.features}
            onChange={(e) => setForm({ ...form, features: e.target.value })}
            className="w-full min-h-24 rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              saving || !form.name.trim() || form.price <= 0 || !form.description.trim()
            }
            className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-24"
          >
            {saving ? <LoadingLottie size={28} /> : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export const PricingForm = observer(PricingFormComponent);
