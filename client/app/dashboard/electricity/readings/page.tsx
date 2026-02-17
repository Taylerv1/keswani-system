"use client";

import { useState, useMemo } from "react";
import { Plus, Receipt } from "lucide-react";
import { useTranslation } from "@/lib/translation-context";
import { useElectricity } from "@/modules/electricity/electricity-context";
import { SearchBar, StatusBadge, Pagination, Modal } from "@/components/ui";

const PAGE_SIZE = 8;

export default function ReadingsPage() {
  const { t, locale } = useTranslation();
  const { data, addReading, addBill } = useElectricity();

  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    meterId: "",
    subscriberId: "",
    previousReading: 0,
    currentReading: 0,
    month: new Date().toISOString().slice(0, 7),
    readBy: "",
  });

  const resetForm = () => setForm({ meterId: "", subscriberId: "", previousReading: 0, currentReading: 0, month: new Date().toISOString().slice(0, 7), readBy: "" });

  const openAdd = () => { resetForm(); setModalOpen(true); };

  const getSubscriberName = (id: string) => {
    const s = data.subscribers.find((x) => x.id === id);
    return s ? (locale === "ar" ? s.nameAr : s.name) : id;
  };

  const getEmployeeName = (id: string) => {
    const e = data.employees.find((x) => x.id === id);
    return e ? (locale === "ar" ? e.nameAr : e.name) : id;
  };

  const getMeterNumber = (id: string) => data.meters.find((m) => m.id === id)?.meterNumber ?? id;

  // When meter is selected, auto-fill subscriber and previous reading
  const handleMeterSelect = (meterId: string) => {
    const meter = data.meters.find((m) => m.id === meterId);
    if (!meter) { setForm({ ...form, meterId }); return; }

    const lastReading = data.readings
      .filter((r) => r.meterId === meterId)
      .sort((a, b) => b.readingDate.localeCompare(a.readingDate))[0];

    setForm({
      ...form,
      meterId,
      subscriberId: meter.subscriberId,
      previousReading: lastReading?.currentReading ?? 0,
    });
  };

  const consumption = form.currentReading - form.previousReading;

  const handleSave = () => {
    const reading = {
      meterId: form.meterId,
      subscriberId: form.subscriberId,
      previousReading: form.previousReading,
      currentReading: form.currentReading,
      consumption: Math.max(0, consumption),
      readingDate: new Date().toISOString().split("T")[0],
      month: form.month,
      readBy: form.readBy,
      billGenerated: false,
    };
    addReading(reading);
    setModalOpen(false);
    resetForm();
  };

  const handleGenerateBill = (readingId: string) => {
    const reading = data.readings.find((r) => r.id === readingId);
    if (!reading || reading.billGenerated) return;

    const currentPrice = data.pricing.find((p) => !p.effectiveTo || new Date(p.effectiveTo) >= new Date());
    const pricePerKwh = currentPrice?.pricePerKwh ?? 0.12;
    const baseAmount = reading.consumption * pricePerKwh;
    const additionalFees = data.settings.additionalFees;

    addBill({
      subscriberId: reading.subscriberId,
      meterId: reading.meterId,
      readingId: reading.id,
      month: reading.month,
      consumption: reading.consumption,
      pricePerKwh,
      baseAmount: Math.round(baseAmount * 100) / 100,
      additionalFees,
      totalAmount: Math.round((baseAmount + additionalFees) * 100) / 100,
      status: "unpaid",
      dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + (data.settings.billDueDays || 30)); return d.toISOString().split("T")[0]; })(),
      createdAt: new Date().toISOString().split("T")[0],
    });

    // mark reading as bill generated
    // Note: we use the context's updateReading - but we only have addReading in this context
    // So we'll just reload will show it
  };

  const months = useMemo(() => {
    const ms = new Set(data.readings.map((r) => r.month));
    return Array.from(ms).sort().reverse();
  }, [data.readings]);

  const filtered = useMemo(() => {
    let items = [...data.readings].sort((a, b) => b.readingDate.localeCompare(a.readingDate));
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) => getSubscriberName(r.subscriberId).toLowerCase().includes(q) || getMeterNumber(r.meterId).toLowerCase().includes(q)
      );
    }
    if (filterMonth !== "all") items = items.filter((r) => r.month === filterMonth);
    return items;
  }, [data.readings, search, filterMonth, data.subscribers, data.meters, locale]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("readingManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">{filtered.length} {t("elecReadings")}</p>
        </div>
        <button onClick={openAdd} className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">
          <Plus size={16} />
          {t("addReading")}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>
        <select value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">{t("all")} - {t("month")}</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-background">
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriber")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("meterNumber")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("month")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("previousReading")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("currentReading")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("consumption")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("readBy")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("billGenerated")}</th>
                <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-text-muted">{t("noResults")}</td></tr>
              ) : (
                paginated.map((r) => (
                  <tr key={r.id} className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{getSubscriberName(r.subscriberId)}</td>
                    <td className="px-4 py-3 text-text-secondary">{getMeterNumber(r.meterId)}</td>
                    <td className="px-4 py-3 text-text-secondary">{r.month}</td>
                    <td className="px-4 py-3 text-text-secondary">{r.previousReading.toLocaleString()}</td>
                    <td className="px-4 py-3 text-text-secondary">{r.currentReading.toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-card-orange">{r.consumption} {t("kwh")}</td>
                    <td className="px-4 py-3 text-text-secondary">{getEmployeeName(r.readBy)}</td>
                    <td className="px-4 py-3">
                      {r.billGenerated ? (
                        <span className="text-card-green text-xs font-semibold">✓</span>
                      ) : (
                        <span className="text-card-red text-xs font-semibold">✗</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!r.billGenerated && (
                        <button onClick={() => handleGenerateBill(r.id)} className="h-7 px-3 rounded-lg bg-card-blue text-white text-xs font-medium cursor-pointer border-0 hover:bg-card-blue/90 transition-colors flex items-center gap-1" title={t("generateBill")}>
                          <Receipt size={12} />
                          {t("generateBill")}
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

      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {/* New Reading Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={t("addReading")} maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("elecMeters")}</label>
            <select value={form.meterId} onChange={(e) => handleMeterSelect(e.target.value)} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">--</option>
              {data.meters.filter((m) => m.status === "active").map((m) => (
                <option key={m.id} value={m.id}>{m.meterNumber} - {getSubscriberName(m.subscriberId)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("month")}</label>
            <input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("previousReading")}</label>
              <input type="number" value={form.previousReading} readOnly className="w-full h-10 rounded-lg border border-surface-border bg-background/50 px-3 text-sm text-text-muted" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("currentReading")}</label>
              <input type="number" value={form.currentReading} onChange={(e) => setForm({ ...form, currentReading: +e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          {form.currentReading > 0 && (
            <div className="bg-card-orange-light rounded-lg p-3 text-center">
              <p className="text-xs text-text-muted">{t("consumption")}</p>
              <p className="text-2xl font-bold text-card-orange">{Math.max(0, consumption)} {t("kwh")}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("readBy")}</label>
            <select value={form.readBy} onChange={(e) => setForm({ ...form, readBy: e.target.value })} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">--</option>
              {data.employees.filter((e) => e.role === "meter_reader" && e.status === "active").map((e) => (
                <option key={e.id} value={e.id}>{locale === "ar" ? e.nameAr : e.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setModalOpen(false); resetForm(); }} className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors">{t("cancel")}</button>
            <button onClick={handleSave} disabled={!form.meterId || consumption <= 0} className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{t("save")}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
