"use client";

import { useState, useMemo } from "react";
import { FileDown, Eye, Receipt } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { useElectricity } from "@/features/electricity/context/electricity-context";
import { SearchBar, StatusBadge, Pagination, Modal } from "@/components/ui";
import type { ElecBill } from "@/features/electricity/types";

const PAGE_SIZE = 8;

export default function BillsPage() {
  const { t, locale } = useTranslation();
  const { data } = useElectricity();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [detailBill, setDetailBill] = useState<ElecBill | null>(null);

  const getSubscriberName = (id: string) => {
    const s = data.subscribers.find((x) => x.id === id);
    return s ? (locale === "ar" ? s.nameAr : s.name) : id;
  };

  const getMeterNumber = (id: string) => data.meters.find((m) => m.id === id)?.meterNumber ?? id;

  const months = useMemo(() => {
    const ms = new Set(data.bills.map((b) => b.month));
    return Array.from(ms).sort().reverse();
  }, [data.bills]);

  const filtered = useMemo(() => {
    let items = [...data.bills].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (b) => getSubscriberName(b.subscriberId).toLowerCase().includes(q) || getMeterNumber(b.meterId).toLowerCase().includes(q) || b.id.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") items = items.filter((b) => b.status === filterStatus);
    if (filterMonth !== "all") items = items.filter((b) => b.month === filterMonth);
    return items;
  }, [data.bills, search, filterStatus, filterMonth, data.subscribers, data.meters, locale]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getBillPayments = (billId: string) => data.payments.filter((p) => p.billId === billId);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("billManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">{t("billArchive")}</p>
        </div>
        <button onClick={() => alert("PDF export mock")} className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-primary hover:border-primary/40 transition-colors text-sm font-medium cursor-pointer flex items-center gap-2">
          <FileDown size={16} />
          {t("exportPdf")}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">{t("all")} - {t("status")}</option>
          <option value="paid">{t("paid")}</option>
          <option value="unpaid">{t("unpaid")}</option>
          <option value="partial">{t("partial")}</option>
        </select>
        <select value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">{t("all")} - {t("month")}</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-background">
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriber")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("billMonth")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("consumption")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("pricePerKwh")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("totalAmountBill")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("dueDate")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("status")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-text-muted">{t("noResults")}</td></tr>
              ) : (
                paginated.map((b) => (
                  <tr key={b.id} className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{getSubscriberName(b.subscriberId)}</td>
                    <td className="px-4 py-3 text-text-secondary">{b.month}</td>
                    <td className="px-4 py-3 text-text-secondary">{b.consumption} {t("kwh")}</td>
                    <td className="px-4 py-3 text-text-secondary">${b.pricePerKwh}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">${b.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-text-secondary">{b.dueDate}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDetailBill(b)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0" title={t("viewBill")}>
                          <Eye size={15} />
                        </button>
                        <button onClick={() => alert("PDF download mock")} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0" title={t("exportPdf")}>
                          <FileDown size={15} />
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
            paginated.map((b) => (
              <div key={b.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text-primary text-sm">{getSubscriberName(b.subscriberId)}</span>
                  <StatusBadge status={b.status} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{b.month}</span>
                  <span className="text-text-secondary">{b.consumption} {t("kwh")} · ${b.pricePerKwh}/{t("kwh")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">{t("dueDate")}: {b.dueDate}</span>
                  <span className="text-sm font-semibold text-text-primary">${b.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-end gap-1 pt-1">
                  <button onClick={() => setDetailBill(b)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0" title={t("viewBill")}>
                    <Eye size={15} />
                  </button>
                  <button onClick={() => alert("PDF download mock")} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0" title={t("exportPdf")}>
                    <FileDown size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {/* Bill Detail Modal */}
      <Modal open={!!detailBill} onClose={() => setDetailBill(null)} title={t("billDetails")} maxWidth="max-w-md">
        {detailBill && (() => {
          const payments = getBillPayments(detailBill.id);
          const paidAmount = payments.reduce((s, p) => s + p.amount, 0);
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-card-blue-light text-card-blue flex items-center justify-center">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{getSubscriberName(detailBill.subscriberId)}</p>
                    <p className="text-xs text-text-muted">{detailBill.month}</p>
                  </div>
                </div>
                <StatusBadge status={detailBill.status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  [t("consumption"), `${detailBill.consumption} ${t("kwh")}`],
                  [t("pricePerKwh"), `$${detailBill.pricePerKwh}`],
                  [t("baseAmount"), `$${detailBill.baseAmount.toFixed(2)}`],
                  [t("additionalFees"), `$${detailBill.additionalFees.toFixed(2)}`],
                  [t("totalAmountBill"), `$${detailBill.totalAmount.toFixed(2)}`],
                  [t("dueDate"), detailBill.dueDate],
                ].map(([label, val]) => (
                  <div key={String(label)} className="bg-background rounded-lg p-3">
                    <p className="text-xs text-text-muted">{label}</p>
                    <p className="text-sm font-medium text-text-primary">{val}</p>
                  </div>
                ))}
              </div>

              {payments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-2">{t("elecPayments")}</h4>
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-card-green-light rounded-lg px-3 py-2 mb-1">
                      <span className="text-sm text-text-primary">${p.amount.toFixed(2)}</span>
                      <span className="text-xs text-text-muted">{p.date} - {t(p.method === "bank_transfer" ? "bankTransfer" : "cash")}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-border">
                    <span className="text-sm text-text-secondary">{t("totalCollected")}</span>
                    <span className="text-sm font-bold text-card-green">${paidAmount.toFixed(2)}</span>
                  </div>
                  {paidAmount < detailBill.totalAmount && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-text-secondary">{t("totalOutstanding")}</span>
                      <span className="text-sm font-bold text-card-red">${(detailBill.totalAmount - paidAmount).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => alert("PDF download mock")} className="w-full h-10 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-primary hover:border-primary/40 transition-colors text-sm font-medium cursor-pointer flex items-center justify-center gap-2">
                <FileDown size={16} />
                {t("downloadPdf")}
              </button>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
