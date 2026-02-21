"use client";

import { useState, useMemo } from "react";
import { Plus, FileDown, CreditCard, TrendingUp, AlertTriangle, Receipt } from "lucide-react";
import { useTranslation } from "@/lib/translation-context";
import { useRent } from "@/modules/rent/rent-context";
import { SearchBar, StatusBadge, Pagination, Modal, KpiCard } from "@/components/ui";
import type { Payment } from "@/modules/rent/types";

const PAGE_SIZE = 8;

export default function PaymentsPage() {
  const { t, locale } = useTranslation();
  const { data, addPayment, updatePayment } = useRent();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [payForm, setPayForm] = useState<string | null>(null); // payment id to record

  const getTenantName = (id: string) => {
    const ten = data.tenants.find((x) => x.id === id);
    return ten ? (locale === "ar" ? ten.nameAr : ten.name) : id;
  };

  const totalCollected = data.payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalOutstanding = data.payments.filter((p) => p.status === "overdue").length;
  const totalIncome = data.contracts.filter((c) => c.status === "active").reduce((s, c) => s + c.monthlyRent, 0);

  const filtered = useMemo(() => {
    let items = data.payments;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          getTenantName(p.tenantId).toLowerCase().includes(q) ||
          p.contractId.toLowerCase().includes(q) ||
          (p.receiptNumber?.toLowerCase().includes(q) ?? false) ||
          p.month.includes(q)
      );
    }
    if (filterStatus !== "all") items = items.filter((p) => p.status === filterStatus);
    return items;
  }, [data.payments, search, filterStatus, data.tenants, locale]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRecordPayment = (paymentId: string) => {
    const payment = data.payments.find((p) => p.id === paymentId);
    if (!payment) return;
    const contract = data.contracts.find((c) => c.id === payment.contractId);
    updatePayment(paymentId, {
      status: "paid",
      amount: contract?.monthlyRent ?? 0,
      date: new Date().toISOString().split("T")[0],
      method: "cash",
      receiptNumber: `REC-${Date.now()}`,
    });
    setPayForm(null);
  };

  return (
    <div className="@container">
      <div className="flex flex-col @md:flex-row @md:items-center @md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl @md:text-2xl font-bold text-text-primary">{t("paymentManagement")}</h1>
          <p className="text-text-secondary text-xs @md:text-sm mt-1">{t("paymentHistory")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => alert("PDF export mock")} className="h-9 @md:h-10 px-3 @md:px-4 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-primary hover:border-primary/40 transition-colors text-xs @md:text-sm font-medium cursor-pointer flex items-center gap-1.5 @md:gap-2">
            <FileDown size={16} />
            {t("exportPdf")}
          </button>
          <button onClick={() => alert("Invoice generation mock")} className="h-9 @md:h-10 px-3 @md:px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-xs @md:text-sm font-medium cursor-pointer flex items-center gap-1.5 @md:gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">
            <Receipt size={16} />
            {t("generateInvoice")}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 @sm:grid-cols-2 @2xl:grid-cols-3 gap-3 @md:gap-5 mb-6">
        <KpiCard label={t("totalIncome")} value={`$${totalIncome.toLocaleString()}`} icon={<TrendingUp size={22} />} color="text-card-green" bgColor="bg-card-green-light" trend={t("monthlyRent")} />
        <KpiCard label={t("totalCollected")} value={`$${totalCollected.toLocaleString()}`} icon={<CreditCard size={22} />} color="text-card-blue" bgColor="bg-card-blue-light" />
        <KpiCard label={t("totalOutstanding")} value={totalOutstanding} icon={<AlertTriangle size={22} />} color="text-card-red" bgColor="bg-card-red-light" />
      </div>

      <div className="flex flex-col @xs:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">{t("all")} - {t("status")}</option>
          <option value="paid">{t("paid")}</option>
          <option value="overdue">{t("overdue")}</option>
          <option value="pending">{t("pending")}</option>
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden @3xl:block bg-surface rounded-xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-background">
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("tenant")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("month")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("amount")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("paymentDate")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("paymentMethod")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("receiptNumber")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("status")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-text-muted">{t("noResults")}</td></tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.id} className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{getTenantName(p.tenantId)}</td>
                    <td className="px-4 py-3 text-text-secondary">{p.month}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {p.amount > 0 ? `$${p.amount.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{p.date ?? "—"}</td>
                    <td className="px-4 py-3 text-text-secondary">{p.method ? t(p.method === "bank_transfer" ? "bankTransfer" : "cash") : "—"}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{p.receiptNumber ?? "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      {p.status === "overdue" && (
                        <button onClick={() => setPayForm(p.id)} className="h-8 px-3 rounded-lg bg-card-green text-white text-xs font-medium cursor-pointer border-0 hover:bg-card-green/90 transition-colors">
                          {t("addPayment")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="@3xl:hidden space-y-3">
        {paginated.length === 0 ? (
          <div className="bg-surface rounded-xl border border-surface-border p-6 text-center text-text-muted text-sm">{t("noResults")}</div>
        ) : (
          paginated.map((p) => (
            <div key={p.id} className="bg-surface rounded-xl border border-surface-border p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm text-text-primary">{getTenantName(p.tenantId)}</span>
                <StatusBadge status={p.status} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-2">
                <div>
                  <span className="text-text-muted">{t("month")}: </span>
                  <span className="text-text-secondary">{p.month}</span>
                </div>
                <div>
                  <span className="text-text-muted">{t("amount")}: </span>
                  <span className="font-medium text-text-primary">{p.amount > 0 ? `$${p.amount.toLocaleString()}` : "—"}</span>
                </div>
                <div>
                  <span className="text-text-muted">{t("paymentDate")}: </span>
                  <span className="text-text-secondary">{p.date ?? "—"}</span>
                </div>
                <div>
                  <span className="text-text-muted">{t("paymentMethod")}: </span>
                  <span className="text-text-secondary">{p.method ? t(p.method === "bank_transfer" ? "bankTransfer" : "cash") : "—"}</span>
                </div>
              </div>
              {p.receiptNumber && (
                <p className="text-[11px] text-text-muted mb-2">{t("receiptNumber")}: {p.receiptNumber}</p>
              )}
              {p.status === "overdue" && (
                <button onClick={() => setPayForm(p.id)} className="w-full h-8 mt-1 rounded-lg bg-card-green text-white text-xs font-medium cursor-pointer border-0 hover:bg-card-green/90 transition-colors">
                  {t("addPayment")}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {/* Record Payment Modal */}
      <Modal open={!!payForm} onClose={() => setPayForm(null)} title={t("addPayment")} maxWidth="max-w-sm">
        {payForm && (() => {
          const payment = data.payments.find((p) => p.id === payForm);
          if (!payment) return null;
          const contract = data.contracts.find((c) => c.id === payment.contractId);
          return (
            <div className="space-y-4">
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("tenant")}</p>
                <p className="text-sm font-medium text-text-primary">{getTenantName(payment.tenantId)}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("amount")}</p>
                <p className="text-lg font-bold text-card-green">${contract?.monthlyRent.toLocaleString() ?? 0}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("month")}</p>
                <p className="text-sm font-medium text-text-primary">{payment.month}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPayForm(null)} className="flex-1 h-10 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors">{t("cancel")}</button>
                <button onClick={() => handleRecordPayment(payForm)} className="flex-1 h-10 rounded-lg bg-card-green text-white text-sm font-medium cursor-pointer border-0 hover:bg-card-green/90 transition-colors">{t("confirm")}</button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
