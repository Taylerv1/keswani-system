"use client";

import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { AlertTriangle, DollarSign } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { KpiCard, LoadingLottie } from "@/components/ui";
import { electricityDebtsStore } from "./store";

function useMobxRender() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const dispose = autorun(() => {
      void electricityDebtsStore.observerSnapshot;
      setTick((prev) => prev + 1);
    });

    return () => dispose();
  }, []);
}

function formatMoney(value: number): string {
  return `USD ${value.toFixed(2)}`;
}

export default function DebtsPage() {
  const { t } = useTranslation();
  const store = electricityDebtsStore;

  useMobxRender();

  useEffect(() => {
    void store.bootstrap(t("error"));
  }, [store, t]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t("debtManagement")}</h1>
        <p className="text-text-secondary text-sm mt-1">{t("debtSummary")}</p>
      </div>

      {store.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {store.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <KpiCard
          label={t("totalDebt")}
          value={formatMoney(store.totalDebt)}
          icon={<DollarSign size={22} />}
          color="text-card-red"
          bgColor="bg-card-red-light"
        />
        <KpiCard
          label={t("unpaidBills")}
          value={store.totalUnpaidBills}
          icon={<AlertTriangle size={22} />}
          color="text-card-orange"
          bgColor="bg-card-orange-light"
        />
      </div>

      {store.loading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : store.items.length === 0 ? (
        <div className="bg-surface rounded-xl border border-surface-border p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-card-green-light text-card-green flex items-center justify-center mx-auto mb-3">
            <DollarSign size={24} />
          </div>
          <p className="text-text-primary font-medium">{t("noDebt")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {store.items.map((item) => {
            const barWidth = (item.total_debt / store.maxDebt) * 100;

            return (
              <div
                key={item.subscriber_id}
                className="bg-surface rounded-xl border border-surface-border p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">{item.subscriber_name}</h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {item.subscription_number}
                      {item.unit?.unit_number ? ` - ${item.unit.unit_number}` : ""}
                      {item.subscriber_phone ? ` - ${item.subscriber_phone}` : ""}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-xl font-bold text-card-red">{formatMoney(item.total_debt)}</p>
                    <p className="text-xs text-text-muted">
                      {item.unpaid_bills} {t("unpaidBills")}
                    </p>
                  </div>
                </div>

                <div className="h-2 bg-background rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-card-red to-card-orange rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>
                    {t("lastPaymentDate")}: {item.last_payment_date ?? "-"}
                  </span>
                  <span>{item.property?.name ?? "-"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
