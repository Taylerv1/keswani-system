"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Eye, FileDown, User } from "lucide-react";
import { useTranslation } from "@/lib/translation-context";
import { useRent } from "@/modules/rent/rent-context";
import {
  SearchBar,
  StatusBadge,
  Pagination,
  Modal,
  ConfirmDialog,
} from "@/components/ui";
import type { Tenant } from "@/modules/rent/types";

const PAGE_SIZE = 6;

export default function TenantsPage() {
  const { t, locale } = useTranslation();
  const { data, addTenant, updateTenant, removeTenant } = useRent();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<Tenant | null>(null);
  const [editItem, setEditItem] = useState<Tenant | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    nameAr: "",
    email: "",
    phone: "",
    propertyId: "",
    unitNumber: "",
    contractId: "",
    paymentStatus: "paid" as Tenant["paymentStatus"],
    balance: 0,
    joinDate: new Date().toISOString().split("T")[0],
  });

  const resetForm = () => {
    setForm({
      name: "",
      nameAr: "",
      email: "",
      phone: "",
      propertyId: data.properties[0]?.id ?? "",
      unitNumber: "",
      contractId: "",
      paymentStatus: "paid",
      balance: 0,
      joinDate: new Date().toISOString().split("T")[0],
    });
    setEditItem(null);
  };

  const openAdd = () => { resetForm(); setModalOpen(true); };

  const openEdit = (t: Tenant) => {
    setEditItem(t);
    setForm({
      name: t.name,
      nameAr: t.nameAr,
      email: t.email,
      phone: t.phone,
      propertyId: t.propertyId,
      unitNumber: t.unitNumber,
      contractId: t.contractId,
      paymentStatus: t.paymentStatus,
      balance: t.balance,
      joinDate: t.joinDate,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editItem) {
      updateTenant(editItem.id, form);
    } else {
      addTenant(form);
    }
    setModalOpen(false);
    resetForm();
  };

  const getPropertyName = (id: string) => {
    const p = data.properties.find((x) => x.id === id);
    return p ? (locale === "ar" ? p.nameAr : p.name) : id;
  };

  const filtered = useMemo(() => {
    let items = data.tenants;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.nameAr.includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.phone.includes(q)
      );
    }
    if (filterStatus !== "all") items = items.filter((t) => t.paymentStatus === filterStatus);
    return items;
  }, [data.tenants, search, filterStatus]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Get maintenance requests for a tenant
  const getTenantMaintenance = (tenantId: string) =>
    data.maintenanceRequests.filter((m) => m.tenantId === tenantId);

  // Get contract for tenant
  const getTenantContract = (contractId: string) =>
    data.contracts.find((c) => c.id === contractId);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("tenantManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {filtered.length} {t("totalTenants")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert("PDF export mock")}
            className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-primary hover:border-primary/40 transition-colors text-sm font-medium cursor-pointer flex items-center gap-2"
          >
            <FileDown size={16} />
            {t("exportPdf")}
          </button>
          <button
            onClick={openAdd}
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            <Plus size={16} />
            {t("addTenant")}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">{t("all")} - {t("paymentStatus")}</option>
          <option value="paid">{t("paid")}</option>
          <option value="late">{t("late")}</option>
          <option value="overdue">{t("overdue")}</option>
          <option value="pending">{t("pending")}</option>
        </select>
      </div>

      <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-background">
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("tenantName")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("email")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("property")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("unitNumber")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("paymentStatus")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("balance")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                    {t("noResults")}
                  </td>
                </tr>
              ) : (
                paginated.map((ten) => (
                  <tr key={ten.id} className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-hover text-white flex items-center justify-center shrink-0 text-xs font-bold">
                          {ten.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{locale === "ar" ? ten.nameAr : ten.name}</p>
                          <p className="text-xs text-text-muted">{ten.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{ten.email}</td>
                    <td className="px-4 py-3 text-text-secondary">{getPropertyName(ten.propertyId)}</td>
                    <td className="px-4 py-3 text-text-secondary">{ten.unitNumber}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ten.paymentStatus} />
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {ten.balance > 0 ? (
                        <span className="text-card-red">${ten.balance.toLocaleString()}</span>
                      ) : (
                        <span className="text-card-green">$0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDetailModal(ten)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0" title={t("view")}>
                          <Eye size={15} />
                        </button>
                        <button onClick={() => openEdit(ten)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0" title={t("edit")}>
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteId(ten.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0" title={t("delete")}>
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
      </div>

      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editItem ? t("editTenant") : t("addTenant")} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("name")} (EN)</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("name")} (AR)</label>
              <input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" dir="rtl" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("email")}</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("phone")}</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("paymentStatus")}</label>
              <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as Tenant["paymentStatus"] })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="paid">{t("paid")}</option>
                <option value="late">{t("late")}</option>
                <option value="overdue">{t("overdue")}</option>
                <option value="pending">{t("pending")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("balance")}</label>
              <input type="number" min={0} value={form.balance} onChange={(e) => setForm({ ...form, balance: +e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setModalOpen(false); resetForm(); }} className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors">{t("cancel")}</button>
            <button onClick={handleSave} className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">{t("save")}</button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={t("tenantDetails")} maxWidth="max-w-lg">
        {detailModal && (() => {
          const contract = getTenantContract(detailModal.contractId);
          const maintenance = getTenantMaintenance(detailModal.id);
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-hover text-white flex items-center justify-center text-xl font-bold">
                  {detailModal.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">{locale === "ar" ? detailModal.nameAr : detailModal.name}</h3>
                  <p className="text-sm text-text-secondary">{detailModal.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-3">
                  <p className="text-xs text-text-muted">{t("phone")}</p>
                  <p className="text-sm font-medium text-text-primary">{detailModal.phone}</p>
                </div>
                <div className="bg-background rounded-lg p-3">
                  <p className="text-xs text-text-muted">{t("property")}</p>
                  <p className="text-sm font-medium text-text-primary">{getPropertyName(detailModal.propertyId)}</p>
                </div>
                <div className="bg-background rounded-lg p-3">
                  <p className="text-xs text-text-muted">{t("unitNumber")}</p>
                  <p className="text-sm font-medium text-text-primary">{detailModal.unitNumber}</p>
                </div>
                <div className="bg-background rounded-lg p-3">
                  <p className="text-xs text-text-muted">{t("paymentStatus")}</p>
                  <StatusBadge status={detailModal.paymentStatus} />
                </div>
                {contract && (
                  <>
                    <div className="bg-background rounded-lg p-3">
                      <p className="text-xs text-text-muted">{t("contractDuration")}</p>
                      <p className="text-sm font-medium text-text-primary">{contract.startDate} → {contract.endDate}</p>
                    </div>
                    <div className="bg-background rounded-lg p-3">
                      <p className="text-xs text-text-muted">{t("monthlyRent")}</p>
                      <p className="text-sm font-medium text-text-primary">${contract.monthlyRent}</p>
                    </div>
                  </>
                )}
              </div>
              {maintenance.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-2">{t("maintenanceRequests")} ({maintenance.length})</h4>
                  <div className="space-y-2">
                    {maintenance.map((m) => (
                      <div key={m.id} className="bg-background rounded-lg p-3 flex items-center justify-between">
                        <span className="text-sm text-text-primary">{locale === "ar" ? m.titleAr : m.title}</span>
                        <StatusBadge status={m.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) removeTenant(deleteId); setDeleteId(null); }} confirmWord="DELETE" />
    </div>
  );
}
