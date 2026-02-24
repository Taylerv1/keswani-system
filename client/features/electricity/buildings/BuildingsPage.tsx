"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Eye, Building2 } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { useElectricity } from "@/features/electricity/context/electricity-context";
import { SearchBar, Pagination, Modal, ConfirmDialog } from "@/components/ui";
import type { ElecBuilding } from "@/features/electricity/types";

const PAGE_SIZE = 6;

export default function BuildingsPage() {
  const { t, locale } = useTranslation();
  const { data, addBuilding, updateBuilding, removeBuilding } = useElectricity();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ElecBuilding | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<ElecBuilding | null>(null);

  const emptyForm = {
    name: "", nameAr: "", address: "", addressAr: "",
    totalUnits: 0, subscriberCount: 0, totalConsumption: 0,
  };
  const [form, setForm] = useState(emptyForm);
  const resetForm = () => { setForm(emptyForm); setEditItem(null); };

  const openAdd = () => { resetForm(); setModalOpen(true); };
  const openEdit = (b: ElecBuilding) => {
    setEditItem(b);
    setForm({ name: b.name, nameAr: b.nameAr, address: b.address, addressAr: b.addressAr, totalUnits: b.totalUnits, subscriberCount: b.subscriberCount, totalConsumption: b.totalConsumption });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editItem) updateBuilding(editItem.id, form);
    else addBuilding(form);
    setModalOpen(false);
    resetForm();
  };

  const filtered = useMemo(() => {
    let items = data.buildings;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (b) => b.name.toLowerCase().includes(q) || b.nameAr.includes(q) || b.address.toLowerCase().includes(q)
      );
    }
    return items;
  }, [data.buildings, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getBuildingSubs = (id: string) => data.subscribers.filter((s) => s.buildingId === id);
  const getBuildingConsumption = (id: string) => {
    const subs = getBuildingSubs(id).map((s) => s.id);
    return data.readings.filter((r) => subs.includes(r.subscriberId) && r.month === "2026-01").reduce((s, r) => s + r.consumption, 0);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("buildingManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">{filtered.length} {t("elecBuildings")}</p>
        </div>
        <button onClick={openAdd} className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">
          <Plus size={16} />
          {t("addBuilding")}
        </button>
      </div>

      <div className="mb-5">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {paginated.length === 0 ? (
          <div className="col-span-full bg-surface rounded-xl border border-surface-border p-8 text-center text-text-muted">{t("noResults")}</div>
        ) : (
          paginated.map((b) => {
            const subs = getBuildingSubs(b.id);
            const consumption = getBuildingConsumption(b.id);
            return (
              <div key={b.id} className="bg-surface rounded-xl border border-surface-border p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-card-blue-light text-card-blue flex items-center justify-center">
                    <Building2 size={20} />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setDetailItem(b)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0">
                      <Eye size={15} />
                    </button>
                    <button onClick={() => openEdit(b)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleteId(b.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-text-primary">{locale === "ar" ? b.nameAr : b.name}</h3>
                <p className="text-xs text-text-muted mt-0.5 mb-3">{locale === "ar" ? b.addressAr : b.address}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-background rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-text-primary">{b.totalUnits}</p>
                    <p className="text-xs text-text-muted">{t("units")}</p>
                  </div>
                  <div className="bg-background rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-card-blue">{subs.length}</p>
                    <p className="text-xs text-text-muted">{t("elecSubscribers")}</p>
                  </div>
                  <div className="bg-background rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-card-orange">{consumption}</p>
                    <p className="text-xs text-text-muted">{t("kwh")}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editItem ? t("editBuilding") : t("addBuilding")} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("buildingName")} (EN)</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("buildingName")} (AR)</label>
              <input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} dir="rtl" className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("buildingAddress")} (EN)</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("buildingAddress")} (AR)</label>
              <input value={form.addressAr} onChange={(e) => setForm({ ...form, addressAr: e.target.value })} dir="rtl" className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("totalBuildingUnits")}</label>
            <input type="number" min={0} value={form.totalUnits} onChange={(e) => setForm({ ...form, totalUnits: +e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setModalOpen(false); resetForm(); }} className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors">{t("cancel")}</button>
            <button onClick={handleSave} className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">{t("save")}</button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title={t("buildingDetails")} maxWidth="max-w-lg">
        {detailItem && (() => {
          const subs = getBuildingSubs(detailItem.id);
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  [t("buildingName"), locale === "ar" ? detailItem.nameAr : detailItem.name],
                  [t("buildingAddress"), locale === "ar" ? detailItem.addressAr : detailItem.address],
                  [t("totalBuildingUnits"), detailItem.totalUnits],
                  [t("buildingSubscribers"), subs.length],
                ].map(([l, v]) => (
                  <div key={String(l)} className="bg-background rounded-lg p-3">
                    <p className="text-xs text-text-muted">{l}</p>
                    <p className="text-sm font-medium text-text-primary">{v}</p>
                  </div>
                ))}
              </div>
              {subs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">{t("elecSubscribers")}</h3>
                  <div className="space-y-1">
                    {subs.map((s) => (
                      <div key={s.id} className="flex items-center justify-between bg-background rounded-lg px-3 py-2">
                        <span className="text-sm text-text-primary">{locale === "ar" ? s.nameAr : s.name}</span>
                        <span className="text-xs text-text-muted">{s.unitNumber}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) removeBuilding(deleteId); setDeleteId(null); }} confirmWord="DELETE" />
    </div>
  );
}
