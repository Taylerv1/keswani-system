"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Home,
  MapPin,
  Eye,
} from "lucide-react";
import { useTranslation } from "@/lib/translation-context";
import { useRent } from "@/modules/rent/rent-context";
import {
  SearchBar,
  StatusBadge,
  Pagination,
  Modal,
  ConfirmDialog,
} from "@/components/ui";
import type { Property } from "@/modules/rent/types";

const PAGE_SIZE = 6;

export default function PropertiesPage() {
  const { t, locale } = useTranslation();
  const { data, addProperty, updateProperty, removeProperty } = useRent();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<Property | null>(null);
  const [editItem, setEditItem] = useState<Property | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    nameAr: "",
    type: "building" as Property["type"],
    address: "",
    addressAr: "",
    totalUnits: 1,
    rentedUnits: 0,
    vacantUnits: 1,
    maintenanceUnits: 0,
    status: "active" as Property["status"],
    monthlyIncome: 0,
  });

  const resetForm = () => {
    setForm({
      name: "",
      nameAr: "",
      type: "building",
      address: "",
      addressAr: "",
      totalUnits: 1,
      rentedUnits: 0,
      vacantUnits: 1,
      maintenanceUnits: 0,
      status: "active",
      monthlyIncome: 0,
    });
    setEditItem(null);
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (p: Property) => {
    setEditItem(p);
    setForm({
      name: p.name,
      nameAr: p.nameAr,
      type: p.type,
      address: p.address,
      addressAr: p.addressAr,
      totalUnits: p.totalUnits,
      rentedUnits: p.rentedUnits,
      vacantUnits: p.vacantUnits,
      maintenanceUnits: p.maintenanceUnits,
      status: p.status,
      monthlyIncome: p.monthlyIncome,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editItem) {
      updateProperty(editItem.id, form);
    } else {
      addProperty({
        ...form,
        image: null,
        createdAt: new Date().toISOString().split("T")[0],
      });
    }
    setModalOpen(false);
    resetForm();
  };

  const filtered = useMemo(() => {
    let items = data.properties;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameAr.includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.addressAr.includes(q)
      );
    }
    if (filterType !== "all") items = items.filter((p) => p.type === filterType);
    if (filterStatus !== "all") items = items.filter((p) => p.status === filterStatus);
    return items;
  }, [data.properties, search, filterType, filterStatus]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t("propertyManagement")}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {filtered.length} {t("totalProperties")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openAdd}
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            <Plus size={16} />
            {t("addProperty")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">{t("all")} - {t("propertyType")}</option>
          <option value="building">{t("building")}</option>
          <option value="house">{t("house")}</option>
          <option value="land">{t("land")}</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">{t("all")} - {t("status")}</option>
          <option value="active">{t("active")}</option>
          <option value="vacant">{t("vacant")}</option>
          <option value="inactive">{t("inactive")}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-background">
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                  {t("propertyName")}
                </th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                  {t("propertyType")}
                </th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                  {t("address")}
                </th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                  {t("units")}
                </th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                  {t("monthlyIncome")}
                </th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                  {t("status")}
                </th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                  {t("actions")}
                </th>
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
                paginated.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-card-blue-light text-card-blue flex items-center justify-center shrink-0">
                          {p.type === "building" ? (
                            <Building2 size={16} />
                          ) : p.type === "house" ? (
                            <Home size={16} />
                          ) : (
                            <MapPin size={16} />
                          )}
                        </div>
                        <span className="font-medium text-text-primary">
                          {locale === "ar" ? p.nameAr : p.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{t(p.type)}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {locale === "ar" ? p.addressAr : p.address}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-card-green font-medium">{p.rentedUnits}</span>
                      <span className="text-text-muted"> / {p.totalUnits}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      ${p.monthlyIncome.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetailModal(p)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0"
                          title={t("view")}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0"
                          title={t("edit")}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0"
                          title={t("delete")}
                        >
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

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editItem ? t("editProperty") : t("addProperty")}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("propertyName")} (EN)
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("propertyName")} (AR)
              </label>
              <input
                value={form.nameAr}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                dir="rtl"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("propertyType")}
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as Property["type"] })}
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="building">{t("building")}</option>
                <option value="house">{t("house")}</option>
                <option value="land">{t("land")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("status")}
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Property["status"] })}
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="active">{t("active")}</option>
                <option value="vacant">{t("vacant")}</option>
                <option value="inactive">{t("inactive")}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("address")} (EN)
              </label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("address")} (AR)
              </label>
              <input
                value={form.addressAr}
                onChange={(e) => setForm({ ...form, addressAr: e.target.value })}
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                dir="rtl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("totalUnits")}
              </label>
              <input
                type="number"
                min={0}
                value={form.totalUnits}
                onChange={(e) => setForm({ ...form, totalUnits: +e.target.value })}
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("rentedUnits")}
              </label>
              <input
                type="number"
                min={0}
                value={form.rentedUnits}
                onChange={(e) => setForm({ ...form, rentedUnits: +e.target.value })}
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("vacantUnits")}
              </label>
              <input
                type="number"
                min={0}
                value={form.vacantUnits}
                onChange={(e) => setForm({ ...form, vacantUnits: +e.target.value })}
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("monthlyIncome")}
              </label>
              <input
                type="number"
                min={0}
                value={form.monthlyIncome}
                onChange={(e) => setForm({ ...form, monthlyIncome: +e.target.value })}
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setModalOpen(false); resetForm(); }}
              className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
            >
              {t("save")}
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        title={t("propertyDetails")}
        maxWidth="max-w-lg"
      >
        {detailModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-card-blue-light text-card-blue flex items-center justify-center">
                {detailModal.type === "building" ? (
                  <Building2 size={28} />
                ) : detailModal.type === "house" ? (
                  <Home size={28} />
                ) : (
                  <MapPin size={28} />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {locale === "ar" ? detailModal.nameAr : detailModal.name}
                </h3>
                <p className="text-sm text-text-secondary">
                  {locale === "ar" ? detailModal.addressAr : detailModal.address}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("propertyType")}</p>
                <p className="text-sm font-medium text-text-primary">{t(detailModal.type)}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("status")}</p>
                <StatusBadge status={detailModal.status} />
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("totalUnits")}</p>
                <p className="text-sm font-medium text-text-primary">{detailModal.totalUnits}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("rentedUnits")}</p>
                <p className="text-sm font-medium text-card-green">{detailModal.rentedUnits}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("vacantUnits")}</p>
                <p className="text-sm font-medium text-card-orange">{detailModal.vacantUnits}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("monthlyIncome")}</p>
                <p className="text-sm font-medium text-text-primary">
                  ${detailModal.monthlyIncome.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) removeProperty(deleteId);
          setDeleteId(null);
        }}
        confirmWord="DELETE"
      />
    </div>
  );
}
