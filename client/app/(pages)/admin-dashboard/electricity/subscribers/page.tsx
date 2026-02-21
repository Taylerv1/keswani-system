"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Eye, FileDown } from "lucide-react";
import { useTranslation } from "@/lib/translation-context";
import { useElectricity } from "@/modules/electricity/electricity-context";
import { SearchBar, StatusBadge, Pagination, Modal, ConfirmDialog } from "@/components/ui";
import type { ElecSubscriber } from "@/modules/electricity/types";

const PAGE_SIZE = 8;

type DetailTab = "info" | "readings" | "bills" | "payments";

export default function SubscribersPage() {
  const { t, locale } = useTranslation();
  const { data, addSubscriber, updateSubscriber, removeSubscriber } = useElectricity();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ElecSubscriber | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<ElecSubscriber | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("info");

  const emptyForm = {
    name: "", nameAr: "", phone: "", email: "",
    buildingId: "", unitNumber: "", meterId: "",
    status: "active" as ElecSubscriber["status"],
    joinDate: new Date().toISOString().split("T")[0],
    balance: 0,
  };

  const [form, setForm] = useState(emptyForm);
  const resetForm = () => { setForm(emptyForm); setEditItem(null); };

  const openAdd = () => { resetForm(); setModalOpen(true); };
  const openEdit = (s: ElecSubscriber) => {
    setEditItem(s);
    setForm({
      name: s.name, nameAr: s.nameAr, phone: s.phone, email: s.email,
      buildingId: s.buildingId, unitNumber: s.unitNumber, meterId: s.meterId,
      status: s.status, joinDate: s.joinDate, balance: s.balance,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editItem) {
      updateSubscriber(editItem.id, form);
    } else {
      addSubscriber(form);
    }
    setModalOpen(false);
    resetForm();
  };

  const getBuildingName = (id: string) => {
    const b = data.buildings.find((x) => x.id === id);
    return b ? (locale === "ar" ? b.nameAr : b.name) : id;
  };

  const filtered = useMemo(() => {
    let items = data.subscribers;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.nameAr.includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          s.unitNumber.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") items = items.filter((s) => s.status === filterStatus);
    return items;
  }, [data.subscribers, search, filterStatus]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const subReadings = detailItem ? data.readings.filter((r) => r.subscriberId === detailItem.id) : [];
  const subBills = detailItem ? data.bills.filter((b) => b.subscriberId === detailItem.id) : [];
  const subPayments = detailItem ? data.payments.filter((p) => p.subscriberId === detailItem.id) : [];

  const tabs: { key: DetailTab; label: string }[] = [
    { key: "info", label: t("subscriberInfo") },
    { key: "readings", label: t("subscriberReadings") },
    { key: "bills", label: t("subscriberBills") },
    { key: "payments", label: t("subscriberPayments") },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("subscriberManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">{filtered.length} {t("elecSubscribers")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => alert("PDF export mock")} className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-primary hover:border-primary/40 transition-colors text-sm font-medium cursor-pointer flex items-center gap-2">
            <FileDown size={16} />
            {t("exportPdf")}
          </button>
          <button onClick={openAdd} className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">
            <Plus size={16} />
            {t("addSubscriber")}
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
          <option value="inactive">{t("inactive")}</option>
          <option value="suspended">{t("suspended")}</option>
        </select>
      </div>

      <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-background">
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriberName")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriberBuilding")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriberUnit")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriberPhone")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriberBalance")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("status")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">{t("noResults")}</td></tr>
              ) : (
                paginated.map((s) => (
                  <tr key={s.id} className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{locale === "ar" ? s.nameAr : s.name}</td>
                    <td className="px-4 py-3 text-text-secondary">{getBuildingName(s.buildingId)}</td>
                    <td className="px-4 py-3 text-text-secondary">{s.unitNumber}</td>
                    <td className="px-4 py-3 text-text-secondary">{s.phone}</td>
                    <td className={`px-4 py-3 font-medium ${s.balance < 0 ? "text-card-red" : "text-card-green"}`}>
                      ${Math.abs(s.balance).toFixed(2)}{s.balance < 0 ? " ▼" : ""}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setDetailItem(s); setDetailTab("info"); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0" title={t("view")}>
                          <Eye size={15} />
                        </button>
                        <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0" title={t("edit")}>
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteId(s.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0" title={t("delete")}>
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
        <div className="md:hidden divide-y divide-surface-border">
          {paginated.length === 0 ? (
            <div className="px-4 py-8 text-center text-text-muted">{t("noResults")}</div>
          ) : (
            paginated.map((s) => (
              <div key={s.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text-primary text-sm">{locale === "ar" ? s.nameAr : s.name}</span>
                  <StatusBadge status={s.status} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{getBuildingName(s.buildingId)} · {s.unitNumber}</span>
                  <span className={`font-medium ${s.balance < 0 ? "text-card-red" : "text-card-green"}`}>
                    ${Math.abs(s.balance).toFixed(2)}{s.balance < 0 ? " ▼" : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">{s.phone}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setDetailItem(s); setDetailTab("info"); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0" title={t("view")}>
                      <Eye size={15} />
                    </button>
                    <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0" title={t("edit")}>
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleteId(s.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0" title={t("delete")}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editItem ? t("editSubscriber") : t("addSubscriber")} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("name")} (EN)</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("name")} (AR)</label>
              <input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} dir="rtl" className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("phone")}</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("email")}</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("subscriberBuilding")}</label>
              <select value={form.buildingId} onChange={(e) => setForm({ ...form, buildingId: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">--</option>
                {data.buildings.map((b) => (
                  <option key={b.id} value={b.id}>{locale === "ar" ? b.nameAr : b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("subscriberUnit")}</label>
              <input value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("status")}</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ElecSubscriber["status"] })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="active">{t("active")}</option>
                <option value="inactive">{t("inactive")}</option>
                <option value="suspended">{t("suspended")}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setModalOpen(false); resetForm(); }} className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors">{t("cancel")}</button>
            <button onClick={handleSave} className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">{t("save")}</button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title={t("subscriberDetails")} maxWidth="max-w-2xl">
        {detailItem && (
          <div>
            <div className="flex gap-1 mb-4 border-b border-surface-border overflow-x-auto scrollbar-none -mx-1 px-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setDetailTab(tab.key)}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer bg-transparent whitespace-nowrap ${
                    detailTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {detailTab === "info" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  [t("name"), locale === "ar" ? detailItem.nameAr : detailItem.name],
                  [t("phone"), detailItem.phone],
                  [t("email"), detailItem.email],
                  [t("subscriberBuilding"), getBuildingName(detailItem.buildingId)],
                  [t("subscriberUnit"), detailItem.unitNumber],
                  [t("joinDate"), detailItem.joinDate],
                ].map(([label, val]) => (
                  <div key={label} className="bg-background rounded-lg p-3">
                    <p className="text-xs text-text-muted">{label}</p>
                    <p className="text-sm font-medium text-text-primary">{val}</p>
                  </div>
                ))}
              </div>
            )}

            {detailTab === "readings" && (
              <div>
                {subReadings.length === 0 ? (
                  <p className="px-3 py-4 text-center text-text-muted text-sm">{t("noData")}</p>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-surface-border">
                            <th className="text-start px-3 py-2 text-text-secondary">{t("month")}</th>
                            <th className="text-start px-3 py-2 text-text-secondary">{t("previousReading")}</th>
                            <th className="text-start px-3 py-2 text-text-secondary">{t("currentReading")}</th>
                            <th className="text-start px-3 py-2 text-text-secondary">{t("consumption")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subReadings.map((r) => (
                            <tr key={r.id} className="border-b border-surface-border last:border-0">
                              <td className="px-3 py-2 text-text-primary">{r.month}</td>
                              <td className="px-3 py-2 text-text-secondary">{r.previousReading}</td>
                              <td className="px-3 py-2 text-text-secondary">{r.currentReading}</td>
                              <td className="px-3 py-2 font-medium text-text-primary">{r.consumption} {t("kwh")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile cards */}
                    <div className="sm:hidden divide-y divide-surface-border">
                      {subReadings.map((r) => (
                        <div key={r.id} className="py-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-text-primary">{r.month}</span>
                            <span className="text-sm font-semibold text-text-primary">{r.consumption} {t("kwh")}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-text-muted">
                            <span>{t("previousReading")}: {r.previousReading}</span>
                            <span>{t("currentReading")}: {r.currentReading}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {detailTab === "bills" && (
              <div>
                {subBills.length === 0 ? (
                  <p className="px-3 py-4 text-center text-text-muted text-sm">{t("noData")}</p>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-surface-border">
                            <th className="text-start px-3 py-2 text-text-secondary">{t("billMonth")}</th>
                            <th className="text-start px-3 py-2 text-text-secondary">{t("consumption")}</th>
                            <th className="text-start px-3 py-2 text-text-secondary">{t("totalAmountBill")}</th>
                            <th className="text-start px-3 py-2 text-text-secondary">{t("status")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subBills.map((b) => (
                            <tr key={b.id} className="border-b border-surface-border last:border-0">
                              <td className="px-3 py-2 text-text-primary">{b.month}</td>
                              <td className="px-3 py-2 text-text-secondary">{b.consumption} {t("kwh")}</td>
                              <td className="px-3 py-2 font-medium text-text-primary">${b.totalAmount.toFixed(2)}</td>
                              <td className="px-3 py-2"><StatusBadge status={b.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile cards */}
                    <div className="sm:hidden divide-y divide-surface-border">
                      {subBills.map((b) => (
                        <div key={b.id} className="py-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-text-primary">{b.month}</span>
                            <StatusBadge status={b.status} />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-text-muted">{b.consumption} {t("kwh")}</span>
                            <span className="font-medium text-text-primary">${b.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {detailTab === "payments" && (
              <div>
                {subPayments.length === 0 ? (
                  <p className="px-3 py-4 text-center text-text-muted text-sm">{t("noData")}</p>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-surface-border">
                            <th className="text-start px-3 py-2 text-text-secondary">{t("date")}</th>
                            <th className="text-start px-3 py-2 text-text-secondary">{t("amount")}</th>
                            <th className="text-start px-3 py-2 text-text-secondary">{t("paymentMethod")}</th>
                            <th className="text-start px-3 py-2 text-text-secondary">{t("receiptNumber")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subPayments.map((p) => (
                            <tr key={p.id} className="border-b border-surface-border last:border-0">
                              <td className="px-3 py-2 text-text-primary">{p.date}</td>
                              <td className="px-3 py-2 font-medium text-card-green">${p.amount.toFixed(2)}</td>
                              <td className="px-3 py-2 text-text-secondary">{t(p.method === "bank_transfer" ? "bankTransfer" : "cash")}</td>
                              <td className="px-3 py-2 text-text-muted text-xs">{p.receiptNumber}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile cards */}
                    <div className="sm:hidden divide-y divide-surface-border">
                      {subPayments.map((p) => (
                        <div key={p.id} className="py-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-text-primary">{p.date}</span>
                            <span className="text-sm font-semibold text-card-green">${p.amount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-text-muted">
                            <span>{t(p.method === "bank_transfer" ? "bankTransfer" : "cash")}</span>
                            <span>{p.receiptNumber}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) removeSubscriber(deleteId); setDeleteId(null); }} confirmWord="DELETE" />
    </div>
  );
}
