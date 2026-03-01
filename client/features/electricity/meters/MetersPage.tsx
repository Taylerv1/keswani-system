"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Gauge } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { useElectricity } from "@/features/electricity/context/electricity-context";
import { SearchBar, StatusBadge, Pagination, Modal, ConfirmDialog } from "@/components/ui";
import type { ElecMeter } from "@/features/electricity/types";

const PAGE_SIZE = 8;

export default function MetersPage() {
  const { t, locale } = useTranslation();
  const { data, addMeter, updateMeter, removeMeter } = useElectricity();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ElecMeter | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const emptyForm = {
    subscriberId: "",
    meterNumber: "",
    type: "digital" as ElecMeter["type"],
    status: "active" as ElecMeter["status"],
    installDate: new Date().toISOString().split("T")[0],
    lastReadingDate: "",
  };
  const [form, setForm] = useState(emptyForm);
  const resetForm = () => { setForm(emptyForm); setEditItem(null); };

  const openAdd = () => { resetForm(); setModalOpen(true); };
  const openEdit = (m: ElecMeter) => {
    setEditItem(m);
    setForm({ subscriberId: m.subscriberId, meterNumber: m.meterNumber, type: m.type, status: m.status, installDate: m.installDate, lastReadingDate: m.lastReadingDate });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editItem) updateMeter(editItem.id, form);
    else addMeter(form);
    setModalOpen(false);
    resetForm();
  };

  const getSubscriberName = (id: string) => {
    const s = data.subscribers.find((x) => x.id === id);
    return s ? (locale === "ar" ? s.nameAr : s.name) : id;
  };

  const filtered = useMemo(() => {
    let items = data.meters;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (m) => m.meterNumber.toLowerCase().includes(q) || getSubscriberName(m.subscriberId).toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") items = items.filter((m) => m.status === filterStatus);
    if (filterType !== "all") items = items.filter((m) => m.type === filterType);
    return items;
  }, [data.meters, search, filterStatus, filterType, data.subscribers, locale]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("meterManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">{filtered.length} {t("elecMeters")}</p>
        </div>
        <button onClick={openAdd} className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">
          <Plus size={16} />
          {t("addMeter")}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">{t("all")} - {t("status")}</option>
          <option value="active">{t("active")}</option>
          <option value="inactive">{t("inactive")}</option>
          <option value="faulty">{t("faulty")}</option>
        </select>
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">{t("all")} - {t("meterType")}</option>
          <option value="digital">{t("digital")}</option>
          <option value="analog">{t("analog")}</option>
        </select>
      </div>

      <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-background">
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("meterNumber")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriber")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("meterType")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("status")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("installDate")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("lastReadingDate")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">{t("noResults")}</td></tr>
              ) : (
                paginated.map((m) => (
                  <tr key={m.id} className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Gauge size={14} className="text-text-muted shrink-0" />
                        <span className="font-medium text-text-primary">{m.meterNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{getSubscriberName(m.subscriberId)}</td>
                    <td className="px-4 py-3"><StatusBadge status={m.type} /></td>
                    <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                    <td className="px-4 py-3 text-text-secondary">{m.installDate}</td>
                    <td className="px-4 py-3 text-text-secondary">{m.lastReadingDate}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(m)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0" title={t("edit")}><Pencil size={15} /></button>
                        <button onClick={() => setDeleteId(m.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0" title={t("delete")}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-surface-border">
          {paginated.length === 0 ? (
            <div className="px-4 py-8 text-center text-text-muted">{t("noResults")}</div>
          ) : (
            paginated.map((m) => (
              <div key={m.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge size={14} className="text-text-muted shrink-0" />
                    <span className="font-medium text-text-primary text-sm">{m.meterNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={m.type} />
                    <StatusBadge status={m.status} />
                  </div>
                </div>
                <div className="text-xs text-text-secondary">{getSubscriberName(m.subscriberId)}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{t("installDate")}: {m.installDate}</span>
                  <span className="text-text-muted">{t("lastReadingDate")}: {m.lastReadingDate}</span>
                </div>
                <div className="flex items-center justify-end gap-1 pt-1">
                  <button onClick={() => openEdit(m)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0" title={t("edit")}><Pencil size={15} /></button>
                  <button onClick={() => setDeleteId(m.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0" title={t("delete")}><Trash2 size={15} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editItem ? t("editMeter") : t("addMeter")} maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("meterNumber")}</label>
            <input value={form.meterNumber} onChange={(e) => setForm({ ...form, meterNumber: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("linkToSubscriber")}</label>
            <select value={form.subscriberId} onChange={(e) => setForm({ ...form, subscriberId: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">--</option>
              {data.subscribers.map((s) => (
                <option key={s.id} value={s.id}>{locale === "ar" ? s.nameAr : s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("meterType")}</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ElecMeter["type"] })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="digital">{t("digital")}</option>
                <option value="analog">{t("analog")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("status")}</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ElecMeter["status"] })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="active">{t("active")}</option>
                <option value="inactive">{t("inactive")}</option>
                <option value="faulty">{t("faulty")}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("installDate")}</label>
            <input type="date" value={form.installDate} onChange={(e) => setForm({ ...form, installDate: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setModalOpen(false); resetForm(); }} className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors">{t("cancel")}</button>
            <button onClick={handleSave} className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">{t("save")}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) removeMeter(deleteId); setDeleteId(null); }} confirmWord={t("cancel")} />
    </div>
  );
}
