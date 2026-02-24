"use client";

import { useMemo } from "react";
import { AlertTriangle, DollarSign } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { useElectricity } from "@/features/electricity/context/electricity-context";
import { KpiCard } from "@/components/ui";

export default function DebtsPage() {
  const { t, locale } = useTranslation();
  const { data } = useElectricity();

  const debtBySubscriber = useMemo(() => {
    const map: Record<string, { subscriberId: string; unpaidBills: number; totalDebt: number; lastPaymentDate: string | null }> = {};

    for (const bill of data.bills) {
      if (bill.status === "paid") continue;
      const paidOnBill = data.payments.filter((p) => p.billId === bill.id).reduce((s, p) => s + p.amount, 0);
      const remaining = bill.totalAmount - paidOnBill;
      if (remaining <= 0) continue;

      if (!map[bill.subscriberId]) {
        map[bill.subscriberId] = { subscriberId: bill.subscriberId, unpaidBills: 0, totalDebt: 0, lastPaymentDate: null };
      }
      map[bill.subscriberId].unpaidBills += 1;
      map[bill.subscriberId].totalDebt += remaining;
    }

    // Find last payment date per subscriber
    for (const key of Object.keys(map)) {
      const subPayments = data.payments.filter((p) => p.subscriberId === key).sort((a, b) => b.date.localeCompare(a.date));
      map[key].lastPaymentDate = subPayments[0]?.date ?? null;
    }

    return Object.values(map).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [data.bills, data.payments]);

  const totalDebt = debtBySubscriber.reduce((s, d) => s + d.totalDebt, 0);
  const totalUnpaidBills = debtBySubscriber.reduce((s, d) => s + d.unpaidBills, 0);

  const getSubscriberName = (id: string) => {
    const s = data.subscribers.find((x) => x.id === id);
    return s ? (locale === "ar" ? s.nameAr : s.name) : id;
  };

  const maxDebt = Math.max(...debtBySubscriber.map((d) => d.totalDebt), 1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t("debtManagement")}</h1>
        <p className="text-text-secondary text-sm mt-1">{t("debtSummary")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <KpiCard label={t("totalDebt")} value={`$${totalDebt.toFixed(2)}`} icon={<DollarSign size={22} />} color="text-card-red" bgColor="bg-card-red-light" />
        <KpiCard label={t("unpaidBills")} value={totalUnpaidBills} icon={<AlertTriangle size={22} />} color="text-card-orange" bgColor="bg-card-orange-light" />
      </div>

      {debtBySubscriber.length === 0 ? (
        <div className="bg-surface rounded-xl border border-surface-border p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-card-green-light text-card-green flex items-center justify-center mx-auto mb-3">
            <DollarSign size={24} />
          </div>
          <p className="text-text-primary font-medium">{t("noDebt")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {debtBySubscriber.map((d) => {
            const sub = data.subscribers.find((s) => s.id === d.subscriberId);
            const barWidth = (d.totalDebt / maxDebt) * 100;
            return (
              <div key={d.subscriberId} className="bg-surface rounded-xl border border-surface-border p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">{getSubscriberName(d.subscriberId)}</h3>
                    <p className="text-xs text-text-muted mt-0.5">{sub?.unitNumber} · {sub?.phone}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-xl font-bold text-card-red">${d.totalDebt.toFixed(2)}</p>
                    <p className="text-xs text-text-muted">{d.unpaidBills} {t("unpaidBills")}</p>
                  </div>
                </div>

                {/* Debt bar */}
                <div className="h-2 bg-background rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-card-red to-card-orange rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{t("lastPaymentDate")}: {d.lastPaymentDate ?? "—"}</span>
                  <span>{sub?.status === "suspended" ? `⚠️ ${t("suspended")}` : ""}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
