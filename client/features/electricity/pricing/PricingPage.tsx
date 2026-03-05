"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Zap, DollarSign } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { LoadingLottie, Modal, KpiCard } from "@/components/ui";
import {
  createPricingPlan,
  getPricingPlans,
  type PricingPlan,
  type PricingPlanPayload,
  updatePricingPlan,
} from "@/services/pricingService";

export default function PricingPage() {
  const { t } = useTranslation();

  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PricingPlan | null>(null);
  const [form, setForm] = useState({
    name: "",
    price: 0,
    description: "",
    features: "",
  });

  const resetForm = () =>
    setForm({
      name: "",
      price: 0,
      description: "",
      features: "",
    });

  const parseFeatures = (value: string) =>
    value
      .split("\n")
      .map((feature) => feature.trim())
      .filter(Boolean);

  const fetchPlans = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const result = await getPricingPlans();
      setPlans(result);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch pricing plans");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPlans();
  }, []);

  const sorted = useMemo(() => [...plans].sort((a, b) => b.price - a.price), [plans]);
  const currentPrice = sorted[0];

  const openEdit = (p: PricingPlan) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: p.price,
      description: p.description,
      features: (p.features ?? []).join("\n"),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const payload: PricingPlanPayload = {
        name: form.name.trim(),
        price: form.price,
        description: form.description.trim(),
        features: parseFeatures(form.features),
      };

      if (editing) {
        const updated = await updatePricingPlan(editing.id, payload);

        if (updated) {
          setPlans((prev) => prev.map((plan) => (plan.id === editing.id ? updated : plan)));
        } else {
          await fetchPlans();
        }
      } else {
        const created = await createPricingPlan(payload);

        if (created) {
          setPlans((prev) => [created, ...prev]);
        } else {
          await fetchPlans();
        }
      }

      setModalOpen(false);
      setEditing(null);
      resetForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save pricing plan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("pricingManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">{t("pricingDescription")}</p>
        </div>
        <button onClick={() => { resetForm(); setEditing(null); setModalOpen(true); }} className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">
          <Plus size={16} />
          {t("addPricing")}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mb-6 rounded-xl border border-surface-border bg-surface p-5 text-sm text-text-secondary">
          Loading pricing plans...
        </div>
      )}

      {!isLoading && currentPrice && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          <KpiCard label={t("currentPriceKwh")} value={`$${currentPrice.price.toFixed(2)}`} icon={<Zap size={22} />} color="text-card-orange" bgColor="bg-card-orange-light" />
          <KpiCard label="Current Plan" value={currentPrice.name} icon={<DollarSign size={22} />} color="text-card-blue" bgColor="bg-card-blue-light" />
        </div>
      )}

      {/* Price History */}
      <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border">
          <h2 className="text-sm font-semibold text-text-primary">{t("pricingHistory")}</h2>
        </div>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-background">
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">Name</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">Price</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">Description</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">Features</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-text-muted">
                    No pricing plans found.
                  </td>
                </tr>
              )}
              {sorted.map((p, i) => (
                <tr key={p.id} className={`border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors ${i === 0 ? "bg-card-green-light/30" : ""}`}>
                  <td className="px-4 py-3 text-text-primary font-medium">{p.name}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${i === 0 ? "text-card-green text-lg" : "text-text-primary"}`}>${p.price.toFixed(2)}</span>
                    {i === 0 && <span className="text-xs text-card-green ms-1">({t("current")})</span>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{p.description || "—"}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {p.features?.length ? p.features.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0">
                      <Edit2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-surface-border">
          {sorted.length === 0 && !isLoading && (
            <div className="p-4 text-sm text-text-muted">No pricing plans found.</div>
          )}
          {sorted.map((p, i) => (
            <div key={p.id} className={`p-4 space-y-2 ${i === 0 ? "bg-card-green-light/30" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{p.name}</p>
                  <span className={`font-bold ${i === 0 ? "text-card-green text-lg" : "text-text-primary"}`}>${p.price.toFixed(2)}</span>
                  {i === 0 && <span className="text-xs text-card-green ms-1">({t("current")})</span>}
                </div>
                <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0">
                  <Edit2 size={15} />
                </button>
              </div>
              <p className="text-xs text-text-muted">{p.description || "—"}</p>
              {p.features?.length > 0 && <p className="text-xs text-text-secondary">{p.features.join(" • ")}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Price chart */}
      {sorted.length > 1 && (
        <div className="mt-8 bg-surface rounded-xl border border-surface-border p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">{t("priceTrend")}</h3>
          <div className="flex items-end gap-2 sm:gap-3 h-32 sm:h-40">
            {[...sorted].reverse().map((p) => {
              const maxP = Math.max(...sorted.map((x) => x.price));
              const h = (p.price / maxP) * 100;
              return (
                <div key={p.id} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-text-primary">${p.price.toFixed(2)}</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary-hover transition-all duration-500"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[10px] text-text-muted">{p.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); resetForm(); }} title={editing ? t("editPricing") : t("addPricing")} maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Plan Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Price ($)</label>
            <input type="number" min={0} step={0.01} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full min-h-24 rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Features (one per line)</label>
            <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className="w-full min-h-24 rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setModalOpen(false); setEditing(null); resetForm(); }} className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors">{t("cancel")}</button>
            <button onClick={handleSave} disabled={isSaving || !form.name.trim() || form.price <= 0 || !form.description.trim()} className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-24">
              {isSaving ? <LoadingLottie size={28} /> : t("save")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
