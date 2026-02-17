"use client";

import { useState, useMemo } from "react";
import { Plus, Edit2, Zap, DollarSign } from "lucide-react";
import { useTranslation } from "@/lib/translation-context";
import { useElectricity } from "@/modules/electricity/electricity-context";
import { Modal, KpiCard } from "@/components/ui";
import type { ElecPricing } from "@/modules/electricity/types";

export default function PricingPage() {
  const { t, locale } = useTranslation();
  const { data, addPricing, updatePricing } = useElectricity();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ElecPricing | null>(null);
  const [form, setForm] = useState({ pricePerKwh: 0, effectiveFrom: "", effectiveTo: "", notes: "", notesAr: "" });

  const resetForm = () => setForm({ pricePerKwh: 0, effectiveFrom: "", effectiveTo: "", notes: "", notesAr: "" });

  const sorted = useMemo(() => [...data.pricing].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom)), [data.pricing]);
  const currentPrice = sorted[0];

  const openEdit = (p: ElecPricing) => {
    setEditing(p);
    setForm({ pricePerKwh: p.pricePerKwh, effectiveFrom: p.effectiveFrom, effectiveTo: p.effectiveTo ?? "", notes: p.notes ?? "", notesAr: p.notesAr ?? "" });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editing) {
      updatePricing(editing.id, {
        pricePerKwh: form.pricePerKwh,
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || null,
        notes: form.notes || "",
        notesAr: form.notesAr || "",
      });
    } else {
      addPricing({
        pricePerKwh: form.pricePerKwh,
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || null,
        notes: form.notes || "",
        notesAr: form.notesAr || "",
        createdAt: new Date().toISOString(),
      });
    }
    setModalOpen(false);
    setEditing(null);
    resetForm();
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

      {currentPrice && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          <KpiCard label={t("currentPriceKwh")} value={`$${currentPrice.pricePerKwh}`} icon={<Zap size={22} />} color="text-card-orange" bgColor="bg-card-orange-light" />
          <KpiCard label={t("effectiveFrom")} value={currentPrice.effectiveFrom} icon={<DollarSign size={22} />} color="text-card-blue" bgColor="bg-card-blue-light" />
        </div>
      )}

      {/* Price History */}
      <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border">
          <h2 className="text-sm font-semibold text-text-primary">{t("pricingHistory")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-background">
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("pricePerKwh")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("effectiveFrom")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("effectiveTo")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("notes")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={p.id} className={`border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors ${i === 0 ? "bg-card-green-light/30" : ""}`}>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${i === 0 ? "text-card-green text-lg" : "text-text-primary"}`}>${p.pricePerKwh}</span>
                    {i === 0 && <span className="text-xs text-card-green ms-1">({t("current")})</span>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{p.effectiveFrom}</td>
                  <td className="px-4 py-3 text-text-secondary">{p.effectiveTo ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{locale === "ar" ? (p.notesAr ?? p.notes ?? "—") : (p.notes ?? "—")}</td>
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
      </div>

      {/* Price chart */}
      {sorted.length > 1 && (
        <div className="mt-8 bg-surface rounded-xl border border-surface-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">{t("priceTrend")}</h3>
          <div className="flex items-end gap-3 h-40">
            {[...sorted].reverse().map((p, i) => {
              const maxP = Math.max(...sorted.map((x) => x.pricePerKwh));
              const h = (p.pricePerKwh / maxP) * 100;
              return (
                <div key={p.id} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-text-primary">${p.pricePerKwh}</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary-hover transition-all duration-500"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[10px] text-text-muted">{p.effectiveFrom}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); resetForm(); }} title={editing ? t("editPricing") : t("addPricing")} maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("pricePerKwh")} ($)</label>
              <input type="number" min={0} step={0.001} value={form.pricePerKwh} onChange={(e) => setForm({ ...form, pricePerKwh: +e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("effectiveFrom")}</label>
              <input type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("effectiveTo")}</label>
            <input type="date" value={form.effectiveTo} onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("notes")} (EN)</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("notes")} (AR)</label>
            <input type="text" value={form.notesAr} onChange={(e) => setForm({ ...form, notesAr: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" dir="rtl" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setModalOpen(false); setEditing(null); resetForm(); }} className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors">{t("cancel")}</button>
            <button onClick={handleSave} disabled={!form.pricePerKwh || !form.effectiveFrom} className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{t("save")}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
