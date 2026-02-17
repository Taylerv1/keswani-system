"use client";

import { useState, useMemo } from "react";
import { Plus, CreditCard, FileDown } from "lucide-react";
import { useTranslation } from "@/lib/translation-context";
import { useElectricity } from "@/modules/electricity/electricity-context";
import { SearchBar, Pagination, Modal, KpiCard } from "@/components/ui";

const PAGE_SIZE = 8;

export default function ElecPaymentsPage() {
  const { t, locale } = useTranslation();
  const { data, addPayment, updateBill } = useElectricity();

  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    subscriberId: "",
    billId: "",
    amount: 0,
    method: "cash" as "cash" | "bank_transfer",
    collectedBy: "",
  });

  const resetForm = () => setForm({ subscriberId: "", billId: "", amount: 0, method: "cash", collectedBy: "" });

  const getSubscriberName = (id: string) => {
    const s = data.subscribers.find((x) => x.id === id);
    return s ? (locale === "ar" ? s.nameAr : s.name) : id;
  };

  const getEmployeeName = (id: string) => {
    if (!id) return "—";
    const e = data.employees.find((x) => x.id === id);
    return e ? (locale === "ar" ? e.nameAr : e.name) : id;
  };

  const unpaidBillsForSubscriber = form.subscriberId
    ? data.bills.filter((b) => b.subscriberId === form.subscriberId && (b.status === "unpaid" || b.status === "partial"))
    : [];

  const handleSave = () => {
    const receiptNumber = `EREC-${Date.now()}`;
    addPayment({
      billId: form.billId,
      subscriberId: form.subscriberId,
      amount: form.amount,
      date: new Date().toISOString().split("T")[0],
      method: form.method,
      collectedBy: form.collectedBy || null,
      receiptNumber,
    });

    // Check if bill is fully paid
    const bill = data.bills.find((b) => b.id === form.billId);
    if (bill) {
      const existingPayments = data.payments.filter((p) => p.billId === form.billId).reduce((s, p) => s + p.amount, 0);
      const totalPaid = existingPayments + form.amount;
      if (totalPaid >= bill.totalAmount) {
        updateBill(form.billId, { status: "paid" });
      } else {
        updateBill(form.billId, { status: "partial" });
      }
    }

    setModalOpen(false);
    resetForm();
  };

  const totalCollected = data.payments.reduce((s, p) => s + p.amount, 0);

  const filtered = useMemo(() => {
    let items = [...data.payments].sort((a, b) => b.date.localeCompare(a.date));
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) => getSubscriberName(p.subscriberId).toLowerCase().includes(q) || p.receiptNumber.toLowerCase().includes(q)
      );
    }
    if (filterMethod !== "all") items = items.filter((p) => p.method === filterMethod);
    return items;
  }, [data.payments, search, filterMethod, data.subscribers, locale]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("elecPaymentManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">{t("paymentHistory")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => alert("PDF export mock")} className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-primary hover:border-primary/40 transition-colors text-sm font-medium cursor-pointer flex items-center gap-2">
            <FileDown size={16} />
            {t("exportPdf")}
          </button>
          <button onClick={() => { resetForm(); setModalOpen(true); }} className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">
            <Plus size={16} />
            {t("registerPayment")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        <KpiCard label={t("totalCollected")} value={`$${totalCollected.toFixed(2)}`} icon={<CreditCard size={22} />} color="text-card-green" bgColor="bg-card-green-light" />
        <KpiCard label={t("elecPayments")} value={data.payments.length} icon={<CreditCard size={22} />} color="text-card-blue" bgColor="bg-card-blue-light" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
        <select value={filterMethod} onChange={(e) => { setFilterMethod(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">{t("all")} - {t("paymentMethod")}</option>
          <option value="cash">{t("cash")}</option>
          <option value="bank_transfer">{t("bankTransfer")}</option>
        </select>
      </div>

      <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-background">
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriber")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("date")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("paymentAmount")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("paymentMethod")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("collectedBy")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("receiptNumber")}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">{t("noResults")}</td></tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.id} className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{getSubscriberName(p.subscriberId)}</td>
                    <td className="px-4 py-3 text-text-secondary">{p.date}</td>
                    <td className="px-4 py-3 font-medium text-card-green">${p.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-text-secondary">{t(p.method === "bank_transfer" ? "bankTransfer" : "cash")}</td>
                    <td className="px-4 py-3 text-text-secondary">{getEmployeeName(p.collectedBy ?? "")}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{p.receiptNumber}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {/* Register Payment Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={t("registerPayment")} maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("selectSubscriber")}</label>
            <select value={form.subscriberId} onChange={(e) => setForm({ ...form, subscriberId: e.target.value, billId: "" })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">--</option>
              {data.subscribers.map((s) => (
                <option key={s.id} value={s.id}>{locale === "ar" ? s.nameAr : s.name}</option>
              ))}
            </select>
          </div>
          {form.subscriberId && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("selectBill")}</label>
              <select value={form.billId} onChange={(e) => {
                const bill = data.bills.find((b) => b.id === e.target.value);
                const existingPaid = bill ? data.payments.filter((p) => p.billId === bill.id).reduce((s, p) => s + p.amount, 0) : 0;
                setForm({ ...form, billId: e.target.value, amount: bill ? Math.round((bill.totalAmount - existingPaid) * 100) / 100 : 0 });
              }} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">--</option>
                {unpaidBillsForSubscriber.map((b) => (
                  <option key={b.id} value={b.id}>{b.month} - ${b.totalAmount.toFixed(2)}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("paymentAmount")}</label>
              <input type="number" min={0} step={0.01} value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("paymentMethod")}</label>
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as "cash" | "bank_transfer" })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="cash">{t("cash")}</option>
                <option value="bank_transfer">{t("bankTransfer")}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("collectedBy")}</label>
            <select value={form.collectedBy} onChange={(e) => setForm({ ...form, collectedBy: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">--</option>
              {data.employees.filter((e) => (e.role === "collector" || e.role === "admin") && e.status === "active").map((e) => (
                <option key={e.id} value={e.id}>{locale === "ar" ? e.nameAr : e.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setModalOpen(false); resetForm(); }} className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors">{t("cancel")}</button>
            <button onClick={handleSave} disabled={!form.billId || form.amount <= 0} className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{t("save")}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
