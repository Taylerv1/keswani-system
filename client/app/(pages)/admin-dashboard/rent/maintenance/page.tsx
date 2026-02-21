"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, FileDown, Wrench } from "lucide-react";
import { useTranslation } from "@/lib/translation-context";
import { useRent } from "@/modules/rent/rent-context";
import { SearchBar, StatusBadge, Pagination, Modal, ConfirmDialog } from "@/components/ui";
import type { MaintenanceRequest } from "@/modules/rent/types";

const PAGE_SIZE = 6;

export default function MaintenancePage() {
  const { t, locale } = useTranslation();
  const { data, addMaintenance, updateMaintenance, removeMaintenance } = useRent();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<MaintenanceRequest | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const emptyForm = {
    propertyId: "",
    unitNumber: "",
    tenantId: "",
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    priority: "medium" as MaintenanceRequest["priority"],
    status: "open" as MaintenanceRequest["status"],
    createdAt: new Date().toISOString().split("T")[0],
    updatedAt: new Date().toISOString().split("T")[0],
    cost: null as number | null,
  };

  const [form, setForm] = useState(emptyForm);

  const resetForm = () => { setForm(emptyForm); setEditItem(null); };

  const openAdd = () => { resetForm(); setModalOpen(true); };

  const openEdit = (m: MaintenanceRequest) => {
    setEditItem(m);
    setForm({
      propertyId: m.propertyId,
      unitNumber: m.unitNumber,
      tenantId: m.tenantId,
      title: m.title,
      titleAr: m.titleAr,
      description: m.description,
      descriptionAr: m.descriptionAr,
      priority: m.priority,
      status: m.status,
      createdAt: m.createdAt,
      updatedAt: new Date().toISOString().split("T")[0],
      cost: m.cost,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editItem) {
      updateMaintenance(editItem.id, { ...form, updatedAt: new Date().toISOString().split("T")[0] });
    } else {
      addMaintenance(form);
    }
    setModalOpen(false);
    resetForm();
  };

  const getPropertyName = (id: string) => {
    const p = data.properties.find((x) => x.id === id);
    return p ? (locale === "ar" ? p.nameAr : p.name) : id;
  };

  const getTenantName = (id: string) => {
    const ten = data.tenants.find((x) => x.id === id);
    return ten ? (locale === "ar" ? ten.nameAr : ten.name) : id;
  };

  const filtered = useMemo(() => {
    let items = data.maintenanceRequests;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.titleAr.includes(q) ||
          getPropertyName(m.propertyId).toLowerCase().includes(q) ||
          getTenantName(m.tenantId).toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") items = items.filter((m) => m.status === filterStatus);
    if (filterPriority !== "all") items = items.filter((m) => m.priority === filterPriority);
    return items;
  }, [data.maintenanceRequests, search, filterStatus, filterPriority, data.properties, data.tenants, locale]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const priorityDot = (p: string) =>
    p === "high"
      ? "bg-card-red"
      : p === "medium"
        ? "bg-card-orange"
        : "bg-card-blue";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("maintenanceManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">{filtered.length} {t("maintenanceRequests")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => alert("PDF export mock")} className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-primary hover:border-primary/40 transition-colors text-sm font-medium cursor-pointer flex items-center gap-2">
            <FileDown size={16} />
            {t("exportPdf")}
          </button>
          <button onClick={openAdd} className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">
            <Plus size={16} />
            {t("addMaintenanceRequest")}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">{t("all")} - {t("status")}</option>
          <option value="open">{t("open")}</option>
          <option value="in_progress">{t("inProgress")}</option>
          <option value="completed">{t("completed")}</option>
          <option value="closed">{t("closed")}</option>
        </select>
        <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">{t("all")} - {t("priority")}</option>
          <option value="high">{t("high")}</option>
          <option value="medium">{t("medium")}</option>
          <option value="low">{t("low")}</option>
        </select>
      </div>

      <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
        {/* Desktop table (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-background">
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("maintenanceTitle")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("property")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("tenant")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("priority")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("status")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("maintenanceCost")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("createdAt")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-text-muted">{t("noResults")}</td></tr>
              ) : (
                paginated.map((m) => (
                  <tr key={m.id} className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Wrench size={14} className="text-text-muted shrink-0" />
                        <div>
                          <p className="font-medium text-text-primary">{locale === "ar" ? m.titleAr : m.title}</p>
                          <p className="text-xs text-text-muted truncate max-w-[200px]">{locale === "ar" ? m.descriptionAr : m.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{getPropertyName(m.propertyId)} - {m.unitNumber}</td>
                    <td className="px-4 py-3 text-text-secondary">{getTenantName(m.tenantId)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${priorityDot(m.priority)}`} />
                        <StatusBadge status={m.priority} />
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                    <td className="px-4 py-3 text-text-primary">{m.cost != null ? `$${m.cost.toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3 text-text-secondary">{m.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(m)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0" title={t("edit")}>
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteId(m.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0" title={t("delete")}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3 p-3">
          {paginated.length === 0 ? (
            <div className="bg-surface rounded-xl border border-surface-border p-6 text-center text-text-muted text-sm">{t("noResults")}</div>
          ) : (
            paginated.map((m) => (
              <div key={m.id} className="bg-surface rounded-xl border border-surface-border p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-card-blue-light text-card-blue flex items-center justify-center shrink-0">
                      <Wrench size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-text-primary">{locale === "ar" ? m.titleAr : m.title}</div>
                      <div className="text-xs text-text-secondary truncate">{locale === "ar" ? m.descriptionAr : m.description}</div>
                    </div>
                  </div>
                  <div className="text-xs text-text-secondary">{m.createdAt}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary mb-3">
                  <div>
                    <div className="text-[11px]">{t("property")}</div>
                    <div className="font-medium text-text-primary">{getPropertyName(m.propertyId)} - {m.unitNumber}</div>
                  </div>
                  <div>
                    <div className="text-[11px]">{t("priority")}</div>
                    <div className="font-medium text-text-primary">{m.priority}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(m)} className="h-9 px-3 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-primary hover:border-primary transition-colors text-sm font-medium cursor-pointer flex items-center gap-2">
                    <Pencil size={14} />
                    {t("edit")}
                  </button>
                  <button onClick={() => setDeleteId(m.id)} className="h-9 px-3 rounded-lg border border-surface-border text-text-secondary hover:text-card-red hover:border-card-red transition-colors text-sm font-medium cursor-pointer flex items-center gap-2">
                    <Trash2 size={14} />
                    {t("delete")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editItem ? t("editMaintenanceRequest") : t("addMaintenanceRequest")} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("maintenanceTitle")} (EN)</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("maintenanceTitle")} (AR)</label>
              <input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" dir="rtl" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("description")} (EN)</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("description")} (AR)</label>
              <textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} rows={2} className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" dir="rtl" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("property")}</label>
              <select value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">--</option>
                {data.properties.map((p) => (
                  <option key={p.id} value={p.id}>{locale === "ar" ? p.nameAr : p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("unitNumber")}</label>
              <input value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("tenant")}</label>
              <select value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">--</option>
                {data.tenants.map((ten) => (
                  <option key={ten.id} value={ten.id}>{locale === "ar" ? ten.nameAr : ten.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("priority")}</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as MaintenanceRequest["priority"] })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="high">{t("high")}</option>
                <option value="medium">{t("medium")}</option>
                <option value="low">{t("low")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("status")}</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as MaintenanceRequest["status"] })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="open">{t("open")}</option>
                <option value="in_progress">{t("inProgress")}</option>
                <option value="completed">{t("completed")}</option>
                <option value="closed">{t("closed")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("maintenanceCost")}</label>
              <input type="number" min={0} value={form.cost ?? ""} onChange={(e) => setForm({ ...form, cost: e.target.value ? +e.target.value : null })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setModalOpen(false); resetForm(); }} className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors">{t("cancel")}</button>
            <button onClick={handleSave} className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">{t("save")}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) removeMaintenance(deleteId); setDeleteId(null); }} confirmWord="DELETE" />
    </div>
  );
}
