"use client";

import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, UserCog } from "lucide-react";
import { useTranslation } from "@/lib/translation-context";
import { useElectricity } from "@/modules/electricity/electricity-context";
import { SearchBar, StatusBadge, Pagination, Modal, ConfirmDialog } from "@/components/ui";
import type { ElecEmployee } from "@/modules/electricity/types";

const PAGE_SIZE = 8;

export default function EmployeesPage() {
  const { t, locale } = useTranslation();
  const { data, addEmployee, updateEmployee, removeEmployee } = useElectricity();

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ElecEmployee | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", nameAr: "", role: "meter_reader" as ElecEmployee["role"],
    phone: "", email: "", status: "active" as ElecEmployee["status"], joinDate: "",
  });

  const resetForm = () => setForm({ name: "", nameAr: "", role: "meter_reader", phone: "", email: "", status: "active", joinDate: "" });

  const openEdit = (emp: ElecEmployee) => {
    setEditing(emp);
    setForm({ name: emp.name, nameAr: emp.nameAr, role: emp.role, phone: emp.phone, email: emp.email ?? "", status: emp.status, joinDate: emp.joinDate });
    setModalOpen(true);
  };

  const handleSave = () => {
    const payload = {
      name: form.name, nameAr: form.nameAr, role: form.role,
      phone: form.phone, email: form.email || "",
      status: form.status, joinDate: form.joinDate,
    };
    if (editing) {
      updateEmployee(editing.id, payload);
    } else {
      addEmployee(payload);
    }
    setModalOpen(false);
    setEditing(null);
    resetForm();
  };

  const handleDelete = () => {
    if (deleteId) removeEmployee(deleteId);
    setDeleteId(null);
  };

  const filtered = useMemo(() => {
    let items = [...data.employees];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((e) => e.name.toLowerCase().includes(q) || e.nameAr.includes(search) || e.phone.includes(search));
    }
    if (filterRole !== "all") items = items.filter((e) => e.role === filterRole);
    return items;
  }, [data.employees, search, filterRole]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const roleLabel = (role: string) => {
    const map: Record<string, string> = { meter_reader: t("meterReader"), collector: t("collector"), admin: t("admin") };
    return map[role] ?? role;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("employeeManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">{t("employeeDescription")}</p>
        </div>
        <button onClick={() => { resetForm(); setEditing(null); setModalOpen(true); }} className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">
          <Plus size={16} />
          {t("addEmployee")}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
        <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">{t("all")} - {t("employeeRole")}</option>
          <option value="meter_reader">{t("meterReader")}</option>
          <option value="collector">{t("collector")}</option>
          <option value="admin">{t("admin")}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginated.length === 0 ? (
          <div className="md:col-span-2 bg-surface rounded-xl border border-surface-border p-8 text-center text-text-muted">{t("noResults")}</div>
        ) : (
          paginated.map((emp) => (
            <div key={emp.id} className="bg-surface rounded-xl border border-surface-border p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-card-purple-light text-card-purple flex items-center justify-center">
                    <UserCog size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{locale === "ar" ? emp.nameAr : emp.name}</h3>
                    <p className="text-xs text-text-muted mt-0.5">{emp.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(emp)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => setDeleteId(emp.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs px-2 py-1 rounded-md bg-primary-light text-primary font-medium">{roleLabel(emp.role)}</span>
                <StatusBadge status={emp.status} />
              </div>
              {emp.email && <p className="text-xs text-text-muted mt-2">{emp.email}</p>}
              <p className="text-xs text-text-muted mt-1">{t("joinDate")}: {emp.joinDate}</p>
            </div>
          ))
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); resetForm(); }} title={editing ? t("editEmployee") : t("addEmployee")} maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("employeeName")} (EN)</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("employeeName")} (AR)</label>
              <input type="text" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" dir="rtl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("employeeRole")}</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as ElecEmployee["role"] })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="meter_reader">{t("meterReader")}</option>
                <option value="collector">{t("collector")}</option>
                <option value="admin">{t("admin")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("status")}</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="active">{t("active")}</option>
                <option value="inactive">{t("inactive")}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("phone")}</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("email")}</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("joinDate")}</label>
            <input type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setModalOpen(false); setEditing(null); resetForm(); }} className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors">{t("cancel")}</button>
            <button onClick={handleSave} disabled={!form.name || !form.nameAr || !form.phone} className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{t("save")}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onConfirm={handleDelete} onClose={() => setDeleteId(null)} title={t("deleteConfirm")} message={t("deleteEmployeeConfirm")} confirmWord="DELETE" />
    </div>
  );
}
