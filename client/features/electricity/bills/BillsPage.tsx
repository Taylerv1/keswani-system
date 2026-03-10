"use client";

import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { FileDown, Eye, Receipt } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import {
  LoadingLottie,
  Modal,
  Pagination,
  SearchBar,
  StatusBadge,
} from "@/components/ui";
import { billsStore } from "./store";

function useMobxRender() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const dispose = autorun(() => {
      void billsStore.observerSnapshot;
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

export default function BillsPage() {
  const { t, locale } = useTranslation();
  const store = billsStore;

  useMobxRender();

  useEffect(() => {
    void store.bootstrap(t("error"));
  }, [store, t]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("billManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {store.totalItems} {t("elecBills")}
          </p>
        </div>
        <button
          disabled
          className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-not-allowed flex items-center gap-2 opacity-70"
        >
          <FileDown size={16} />
          {t("exportPdf")}
        </button>
      </div>

      {store.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {store.error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar
            value={store.search}
            onChange={(value) => {
              store.setSearch(value);
              void store.loadBills({ errorFallback: t("error") });
            }}
          />
        </div>
        <select
          value={store.filterStatus}
          onChange={(event) => {
            store.setFilterStatus(
              event.target.value as
                | "all"
                | "open"
                | "pending"
                | "overdue"
                | "paid"
                | "cancelled"
            );
            void store.loadBills({ errorFallback: t("error") });
          }}
          className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-44"
        >
          <option value="all">
            {t("all")} - {t("status")}
          </option>
          <option value="open">{t("unpaid")}</option>
          <option value="paid">{t("paid")}</option>
          <option value="pending">{t("pending")}</option>
          <option value="overdue">{t("overdue")}</option>
        </select>
        <select
          value={store.filterMonth}
          onChange={(event) => {
            store.setFilterMonth(event.target.value);
            void store.loadBills({ errorFallback: t("error") });
          }}
          className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-44"
        >
          <option value="all">
            {t("all")} - {t("month")}
          </option>
          {store.availableMonths.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>

      {store.loading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-background">
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriber")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("billMonth")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("meterNumber")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("consumption")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("totalAmountBill")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("totalCollected")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("totalOutstanding")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("status")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {store.items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-text-muted">
                      {t("noResults")}
                    </td>
                  </tr>
                ) : (
                  store.items.map((bill) => (
                    <tr
                      key={bill.id}
                      className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {bill.subscriber_name}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{bill.month}</td>
                      <td className="px-4 py-3 text-text-secondary">{bill.meter_number}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {bill.consumption_kwh.toLocaleString()} {t("kwh")}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatMoney(bill.total_amount, bill.currency)}
                      </td>
                      <td className="px-4 py-3 text-card-green">
                        {formatMoney(bill.paid_amount, bill.currency)}
                      </td>
                      <td className="px-4 py-3 text-card-red">
                        {formatMoney(bill.outstanding_amount, bill.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={bill.status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => void store.openDetail(bill.id, t("error"))}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0"
                          title={t("viewBill")}
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-surface-border">
            {store.items.length === 0 ? (
              <div className="px-4 py-8 text-center text-text-muted">{t("noResults")}</div>
            ) : (
              store.items.map((bill) => (
                <div key={bill.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary text-sm">
                      {bill.subscriber_name}
                    </span>
                    <StatusBadge status={bill.status} />
                  </div>
                  <div className="text-xs text-text-muted">
                    {bill.month} - {bill.meter_number}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-background rounded-lg px-2 py-1.5">
                      <span className="text-text-muted">{t("consumption")}: </span>
                      <span className="text-text-secondary">
                        {bill.consumption_kwh.toLocaleString()} {t("kwh")}
                      </span>
                    </div>
                    <div className="bg-background rounded-lg px-2 py-1.5">
                      <span className="text-text-muted">{t("totalAmountBill")}: </span>
                      <span className="text-text-secondary">
                        {formatMoney(bill.total_amount, bill.currency)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-card-green">
                      {t("totalCollected")}: {formatMoney(bill.paid_amount, bill.currency)}
                    </span>
                    <span className="text-card-red">
                      {t("totalOutstanding")}: {formatMoney(bill.outstanding_amount, bill.currency)}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => void store.openDetail(bill.id, t("error"))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0"
                      title={t("viewBill")}
                    >
                      <Eye size={15} />
                    </button>
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
          void store.loadBills({
            errorFallback: t("error"),
            targetPage: nextPage,
          });
        }}
      />

      <Modal
        open={store.detailOpen}
        onClose={store.closeDetail}
        title={t("billDetails")}
        maxWidth="max-w-2xl"
      >
        {store.detailLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingLottie size={130} className="p-4" />
          </div>
        ) : store.detailBill ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-card-blue-light text-card-blue flex items-center justify-center">
                  <Receipt size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {store.detailBill.subscriber_name}
                  </p>
                  <p className="text-xs text-text-muted">{store.detailBill.subscription_number}</p>
                </div>
              </div>
              <StatusBadge status={store.detailBill.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("billMonth")}</p>
                <p className="text-sm font-medium text-text-primary">{store.detailBill.month}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("meterNumber")}</p>
                <p className="text-sm font-medium text-text-primary">{store.detailBill.meter_number}</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("dueDate")}</p>
                <p className="text-sm font-medium text-text-primary">
                  {formatDate(store.detailBill.due_date, locale)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                [t("previousReading"), `${store.detailBill.previous_reading.toLocaleString()}`],
                [t("currentReading"), `${store.detailBill.current_reading.toLocaleString()}`],
                [t("consumption"), `${store.detailBill.consumption_kwh.toLocaleString()} ${t("kwh")}`],
                [t("pricePerKwh"), formatMoney(store.detailBill.price_per_kwh, store.detailBill.currency)],
                [t("totalAmountBill"), formatMoney(store.detailBill.total_amount, store.detailBill.currency)],
                [t("totalCollected"), formatMoney(store.detailBill.paid_amount, store.detailBill.currency)],
                [t("totalOutstanding"), formatMoney(store.detailBill.outstanding_amount, store.detailBill.currency)],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-background rounded-lg p-3">
                  <p className="text-xs text-text-muted">{label}</p>
                  <p className="text-sm font-medium text-text-primary">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">{t("elecPayments")}</h4>
              {store.detailBill.payments.length === 0 ? (
                <div className="text-sm text-text-muted bg-background rounded-lg p-3">{t("noDataYet")}</div>
              ) : (
                <div className="space-y-2">
                  {store.detailBill.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between bg-background rounded-lg px-3 py-2"
                    >
                      <div>
                        <p className="text-sm text-text-primary">
                          {formatMoney(payment.amount, payment.currency)}
                        </p>
                        <p className="text-xs text-text-muted">
                          {payment.collector_name || "-"} {payment.receipt_number ? `- ${payment.receipt_number}` : ""}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="text-xs text-text-muted">
                          {formatDate(payment.payment_date, locale)}
                        </p>
                        <StatusBadge status={payment.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-text-muted">{t("noData")}</div>
        )}
      </Modal>
    </div>
  );
}
