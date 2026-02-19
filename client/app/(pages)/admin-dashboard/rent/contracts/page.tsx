"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, FileDown, FileText, Download } from "lucide-react";
import { useTranslation } from "@/lib/translation-context";
import { useRent } from "@/modules/rent/rent-context";
import { SearchBar, StatusBadge, Pagination, Modal, ConfirmDialog } from "@/components/ui";
import type { Contract } from "@/modules/rent/types";

const PAGE_SIZE = 6;

export default function ContractsPage() {
  const { t, locale } = useTranslation();
  const { data, addContract, updateContract, removeContract } = useRent();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<Contract | null>(null);
  const [editItem, setEditItem] = useState<Contract | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const emptyForm = {
    tenantId: "",
    propertyId: "",
    unitNumber: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    monthlyRent: 0,
    deposit: 0,
    status: "active" as Contract["status"],
    autoRenew: false,
  };

  const [form, setForm] = useState(emptyForm);

  const resetForm = () => { setForm(emptyForm); setEditItem(null); };

  const openAdd = () => { resetForm(); setModalOpen(true); };

  const openEdit = (c: Contract) => {
    setEditItem(c);
    setForm({
      tenantId: c.tenantId,
      propertyId: c.propertyId,
      unitNumber: c.unitNumber,
      startDate: c.startDate,
      endDate: c.endDate,
      monthlyRent: c.monthlyRent,
      deposit: c.deposit,
      status: c.status,
      autoRenew: c.autoRenew,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editItem) {
      updateContract(editItem.id, form);
    } else {
      addContract(form);
    }
    setModalOpen(false);
    resetForm();
  };

  const getTenantName = (id: string) => {
    const t = data.tenants.find((x) => x.id === id);
    return t ? (locale === "ar" ? t.nameAr : t.name) : id;
  };

  const getPropertyName = (id: string) => {
    const p = data.properties.find((x) => x.id === id);
    return p ? (locale === "ar" ? p.nameAr : p.name) : id;
  };

  const getDaysRemaining = (endDate: string) => {
    const diff = (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(diff));
  };

  const filtered = useMemo(() => {
    let items = data.contracts;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          getTenantName(c.tenantId).toLowerCase().includes(q) ||
          getPropertyName(c.propertyId).toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") items = items.filter((c) => c.status === filterStatus);
    return items;
  }, [data.contracts, search, filterStatus, data.tenants, data.properties, locale]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("contractManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">{filtered.length} {t("rentContracts")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => alert("PDF export mock")} className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-primary hover:border-primary/40 transition-colors text-sm font-medium cursor-pointer flex items-center gap-2">
            <FileDown size={16} />
            {t("exportPdf")}
          </button>
          <button onClick={openAdd} className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">
            <Plus size={16} />
            {t("addContract")}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">{t("all")} - {t("status")}</option>
          <option value="active">{t("active")}</option>
          <option value="expired">{t("expired")}</option>
          <option value="terminated">{t("terminated")}</option>
        </select>
      </div>

      <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-background">
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("contractId")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("tenant")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("property")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("monthlyRent")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("endDate")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("status")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">{t("noResults")}</td></tr>
              ) : (
                paginated.map((c) => {
                  const days = getDaysRemaining(c.endDate);
                  const ending = c.status === "active" && days <= 60 && days > 0;
                  return (
                    <tr key={c.id} className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-text-muted" />
                          <span className="font-medium text-text-primary">{c.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{getTenantName(c.tenantId)}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {getPropertyName(c.propertyId)} - {c.unitNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-text-primary">${c.monthlyRent.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="text-text-secondary">{c.endDate}</span>
                        {ending && (
                          <span className="block text-xs text-card-orange font-medium mt-0.5">
                            {days} {t("daysRemaining")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                        {ending && (
                          <span className="ms-1">
                            <StatusBadge status="endingSoon" variant="warning" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => alert("PDF download mock")} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0" title={t("downloadPdf")}>
                            <Download size={15} />
                          </button>
                          <button onClick={() => setDeleteId(c.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0" title={t("delete")}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editItem ? t("editContract") : t("addContract")} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("tenant")}</label>
              <select value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">--</option>
                {data.tenants.map((ten) => (
                  <option key={ten.id} value={ten.id}>{locale === "ar" ? ten.nameAr : ten.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("property")}</label>
              <select value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">--</option>
                {data.properties.map((p) => (
                  <option key={p.id} value={p.id}>{locale === "ar" ? p.nameAr : p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("unitNumber")}</label>
              <input value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("startDate")}</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("endDate")}</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("monthlyRent")}</label>
              <input type="number" min={0} value={form.monthlyRent} onChange={(e) => setForm({ ...form, monthlyRent: +e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("deposit")}</label>
              <input type="number" min={0} value={form.deposit} onChange={(e) => setForm({ ...form, deposit: +e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("status")}</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Contract["status"] })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="active">{t("active")}</option>
                <option value="expired">{t("expired")}</option>
                <option value="terminated">{t("terminated")}</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.autoRenew} onChange={(e) => setForm({ ...form, autoRenew: e.target.checked })} className="w-4 h-4 rounded border-surface-border accent-primary cursor-pointer" />
            <span className="text-sm text-text-secondary">{t("autoRenew")}</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setModalOpen(false); resetForm(); }} className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors">{t("cancel")}</button>
            <button onClick={handleSave} className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">{t("save")}</button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={t("contractDetails")} maxWidth="max-w-lg">
        {detailModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("contractId")}</p>
                <p className="text-sm font-medium text-text-primary">{detailModal.id}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("status")}</p>
                <StatusBadge status={detailModal.status} />
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("tenant")}</p>
                <p className="text-sm font-medium text-text-primary">{getTenantName(detailModal.tenantId)}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("property")}</p>
                <p className="text-sm font-medium text-text-primary">{getPropertyName(detailModal.propertyId)} - {detailModal.unitNumber}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("startDate")}</p>
                <p className="text-sm font-medium text-text-primary">{detailModal.startDate}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("endDate")}</p>
                <p className="text-sm font-medium text-text-primary">{detailModal.endDate}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("monthlyRent")}</p>
                <p className="text-sm font-medium text-text-primary">${detailModal.monthlyRent.toLocaleString()}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("deposit")}</p>
                <p className="text-sm font-medium text-text-primary">${detailModal.deposit.toLocaleString()}</p>
              </div>
              <div className="bg-background rounded-lg p-3 col-span-2">
                <p className="text-xs text-text-muted">{t("autoRenew")}</p>
                <p className="text-sm font-medium text-text-primary">{detailModal.autoRenew ? t("yes") : t("no")}</p>
              </div>
            </div>
            <button onClick={() => alert("PDF download mock")} className="w-full h-10 rounded-lg border border-primary text-primary hover:bg-primary-light transition-colors text-sm font-medium cursor-pointer flex items-center justify-center gap-2 bg-transparent">
              <Download size={16} />
              {t("downloadPdf")}
            </button>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) removeContract(deleteId); setDeleteId(null); }} confirmWord="DELETE" />
    </div>
  );
}
