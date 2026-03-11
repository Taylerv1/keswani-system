"use client";

import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { CreditCard, FileDown, Plus } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import {
  KpiCard,
  LoadingLottie,
  Modal,
  Pagination,
  SearchBar,
  StatusBadge,
} from "@/components/ui";
import { electricityPaymentsStore } from "./store";

function useMobxRender() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const dispose = autorun(() => {
      void electricityPaymentsStore.observerSnapshot;
      setTick((prev) => prev + 1);
    });

    return () => dispose();
  }, []);
}

function formatMoney(value: number, currency: string): string {
  return `${currency} ${value.toFixed(2)}`;
}

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(locale === "ar" ? "ar-LB" : "en-US");
}

export default function ElecPaymentsPage() {
  const { t, locale } = useTranslation();
  const store = electricityPaymentsStore;

  useMobxRender();

  useEffect(() => {
    void store.bootstrap(t("error"));
  }, [store, t]);

  return (
    <div className="@container">
      <div className="flex flex-col @md:flex-row @md:items-center @md:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl @md:text-2xl font-bold text-text-primary">{t("elecPaymentManagement")}</h1>
          <p className="text-text-secondary text-xs @md:text-sm mt-1">{t("paymentHistory")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled
            className="h-9 @md:h-10 px-3 @md:px-4 rounded-lg border border-surface-border bg-surface text-text-secondary text-xs @md:text-sm font-medium cursor-not-allowed flex items-center gap-1.5 @md:gap-2 opacity-70"
          >
            <FileDown size={15} />
            {t("exportPdf")}
          </button>
          <button
            onClick={store.openAdd}
            className="h-9 @md:h-10 px-3 @md:px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-xs @md:text-sm font-medium cursor-pointer flex items-center gap-1.5 @md:gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            <Plus size={15} />
            {t("registerPayment")}
          </button>
        </div>
      </div>

      {store.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {store.error}
        </div>
      )}
      {store.success && (
        <div className="mb-4 p-3 rounded-lg bg-card-green-light border border-card-green/20 text-card-green text-sm">
          {store.success}
        </div>
      )}

      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3 @md:gap-5 mb-5">
        <KpiCard
          label={t("totalCollected")}
          value={formatMoney(store.totalCollected, "USD")}
          icon={<CreditCard size={22} />}
          color="text-card-green"
          bgColor="bg-card-green-light"
        />
        <KpiCard
          label={t("elecPayments")}
          value={store.totalPayments}
          icon={<CreditCard size={22} />}
          color="text-card-blue"
          bgColor="bg-card-blue-light"
        />
      </div>

      <div className="flex flex-col @xs:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar
            value={store.search}
            onChange={(value) => {
              store.setSearch(value);
              void store.loadPayments({ errorFallback: t("error") });
            }}
          />
        </div>
      </div>

      {store.loading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
          <div className="hidden @3xl:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-background">
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriber")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("billMonth")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("paymentDate")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("paymentAmount")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("collectedBy")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("receiptNumber")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {store.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                      {t("noResults")}
                    </td>
                  </tr>
                ) : (
                  store.items.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {payment.subscriber_name}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {payment.bill.billing_period_end?.slice(0, 7) || "-"}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatDate(payment.payment_date, locale)}
                      </td>
                      <td className="px-4 py-3 font-medium text-card-green">
                        {formatMoney(payment.amount, payment.currency)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {payment.collector_name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs">
                        {payment.receipt_number ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={payment.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="@3xl:hidden divide-y divide-surface-border">
            {store.items.length === 0 ? (
              <div className="px-4 py-8 text-center text-text-muted">{t("noResults")}</div>
            ) : (
              store.items.map((payment) => (
                <div key={payment.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary text-sm">
                      {payment.subscriber_name}
                    </span>
                    <span className="font-semibold text-card-green text-sm">
                      {formatMoney(payment.amount, payment.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">
                      {formatDate(payment.payment_date, locale)}
                    </span>
                    <StatusBadge status={payment.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">{payment.collector_name ?? "-"}</span>
                    <span className="text-text-muted font-mono">{payment.receipt_number ?? "-"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <Pagination
        currentPage={store.page}
        totalPages={store.totalPages}
        totalItems={store.totalItems}
        pageSize={store.PAGE_SIZE}
        onPageChange={(nextPage) => {
          store.setPage(nextPage);
          void store.loadPayments({
            errorFallback: t("error"),
            targetPage: nextPage,
          });
        }}
      />

      <Modal
        open={store.modalOpen}
        onClose={store.closeModal}
        title={t("registerPayment")}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {store.error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {store.error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("selectSubscriber")}</label>
            <select
              value={store.form.subscriber_id}
              onChange={(event) => {
                void store.onSubscriberSelected(event.target.value, t("error"));
              }}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">--</option>
              {store.subscriberOptions.map((subscriber) => (
                <option key={subscriber.id} value={subscriber.id}>
                  {subscriber.client_name} ({subscriber.subscription_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("selectBill")}</label>
            <select
              value={store.form.bill_id}
              onChange={(event) => store.onBillSelected(event.target.value)}
              disabled={!store.form.subscriber_id || store.lookupLoading}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">--</option>
              {store.openBillOptions.map((bill) => (
                <option key={bill.id} value={bill.id}>
                  {bill.month} - {bill.meter_number} - {formatMoney(bill.outstanding_amount, bill.currency)}
                </option>
              ))}
            </select>
          </div>

          {store.selectedBill && (
            <div className="bg-card-orange-light rounded-lg p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">{t("totalAmountBill")}</span>
                <span className="font-medium text-text-primary">
                  {formatMoney(store.selectedBill.total_amount, store.selectedBill.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">{t("totalCollected")}</span>
                <span className="font-medium text-card-green">
                  {formatMoney(store.selectedBill.paid_amount, store.selectedBill.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">{t("totalOutstanding")}</span>
                <span className="font-semibold text-card-red">
                  {formatMoney(store.selectedBill.outstanding_amount, store.selectedBill.currency)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("paymentAmount")}</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={store.form.amount}
              onChange={(event) =>
                store.setForm((prev) => ({
                  ...prev,
                  amount: Number(event.target.value),
                }))
              }
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("collectedBy")}</label>
            <select
              value={store.form.collected_by}
              onChange={(event) =>
                store.setForm((prev) => ({
                  ...prev,
                  collected_by: event.target.value,
                }))
              }
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">--</option>
              {store.collectorOptions.map((collector) => (
                <option key={collector.id} value={collector.id}>
                  {collector.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={store.closeModal}
              disabled={store.actionLoading}
              className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("cancel")}
            </button>
            <button
              onClick={() =>
                void store.save({
                  billRequiredMessage: `${t("bill")} ${t("isRequired")}`,
                  amountRequiredMessage: `${t("paymentAmount")} ${t("isRequired")}`,
                  amountExceededMessage: t("paymentAmount") + " > " + t("totalOutstanding"),
                  createdSuccessMessage: t("paymentCreatedSuccess"),
                  errorFallback: t("error"),
                })
              }
              disabled={!store.form.bill_id || store.actionLoading}
              className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {store.actionLoading ? t("saving") : t("save")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
