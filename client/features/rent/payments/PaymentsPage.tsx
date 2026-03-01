"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  CreditCard,
  FileDown,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "@/lib/translation";
import {
  KpiCard,
  LoadingLottie,
  Pagination,
  SearchBar,
  SelectMenu,
  type SelectOption,
} from "@/components/ui";
import { usePaymentForm, usePaymentState } from "./hooks";
import { toNumber } from "./utils";
import { PaymentTable } from "./components/PaymentTable";
import { PaymentMobileCard } from "./components/PaymentMobileCard";
import { PaymentRecordModal } from "./components/PaymentRecordModal";

export function PaymentsPage() {
  const { t } = useTranslation();

  const state = usePaymentState(t);
  const form = usePaymentForm({
    recordCashPayment: state.recordCashPayment,
  });

  const selectedPayment = useMemo(() => {
    if (!form.selectedPaymentId) return null;
    return state.payments.find((item) => item.id === form.selectedPaymentId) ?? null;
  }, [form.selectedPaymentId, state.payments]);

  const isQueueView = state.viewFilter === "queue";
  const currentViewLabel = isQueueView ? t("paymentQueue") : t("paymentArchive");

  const statusFilterOptions = useMemo<SelectOption[]>(() => {
    const baseOption = { value: "all", label: `${t("all")} - ${t("status")}` };

    if (isQueueView) {
      return [
        baseOption,
        { value: "pending", label: t("pending") },
        { value: "overdue", label: t("overdue") },
        { value: "partial", label: t("partial") },
      ];
    }

    return [
      baseOption,
      { value: "paid", label: t("paid") },
      { value: "cancelled", label: t("cancelled") },
    ];
  }, [isQueueView, t]);

  return (
    <div className="@container">
      <div className="flex flex-col @md:flex-row @md:items-center @md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl @md:text-2xl font-bold text-text-primary">
            {t("paymentManagement")}
          </h1>
          <p className="text-text-secondary text-xs @md:text-sm mt-1">
            {state.totalItems} {currentViewLabel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="h-9 @md:h-10 px-3 @md:px-4 rounded-lg border border-surface-border bg-surface text-text-secondary text-xs @md:text-sm font-medium flex items-center gap-1.5 @md:gap-2 opacity-60 cursor-not-allowed"
          >
            <FileDown size={16} />
            {t("comingSoon")}
          </button>
          <button
            type="button"
            disabled
            className="h-9 @md:h-10 px-3 @md:px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-xs @md:text-sm font-medium flex items-center gap-1.5 @md:gap-2 border-0 opacity-60 cursor-not-allowed"
          >
            <Receipt size={16} />
            {t("generateInvoice")}
          </button>
        </div>
      </div>

      {state.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 @sm:grid-cols-2 @2xl:grid-cols-3 gap-3 @md:gap-5 mb-6">
        <KpiCard
          label={t("totalIncome")}
          value={`$${toNumber(state.summary.total_income).toLocaleString()}`}
          icon={<TrendingUp size={22} />}
          color="text-card-green"
          bgColor="bg-card-green-light"
          trend={t("monthlyRent")}
        />
        <KpiCard
          label={t("totalCollected")}
          value={`$${toNumber(state.summary.total_collected).toLocaleString()}`}
          icon={<CreditCard size={22} />}
          color="text-card-blue"
          bgColor="bg-card-blue-light"
        />
        <KpiCard
          label={t("totalOutstanding")}
          value={toNumber(state.summary.total_outstanding)}
          icon={<AlertTriangle size={22} />}
          color="text-card-red"
          bgColor="bg-card-red-light"
        />
      </div>

      <div className="flex flex-col @md:flex-row @md:items-center gap-3 mb-5">
        <div className="inline-flex w-full @md:w-auto items-center rounded-lg border border-surface-border bg-surface p-1 @md:shrink-0">
          <button
            type="button"
            onClick={() => {
              state.setViewFilter("queue");
              state.setStatusFilter("all");
              state.setPage(1);
            }}
            className={`h-8 flex-1 @md:flex-none px-3 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              isQueueView
                ? "bg-primary text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t("paymentQueue")}
          </button>
          <button
            type="button"
            onClick={() => {
              state.setViewFilter("history");
              state.setStatusFilter("all");
              state.setPage(1);
            }}
            className={`h-8 flex-1 @md:flex-none px-3 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              !isQueueView
                ? "bg-primary text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t("paymentArchive")}
          </button>
        </div>

        <div className="@md:w-52 @md:shrink-0">
          <SelectMenu
            value={state.statusFilter}
            onChange={(value) => {
              state.setStatusFilter(
                value as "all" | "pending" | "paid" | "partial" | "overdue" | "cancelled"
              );
              state.setPage(1);
            }}
            options={statusFilterOptions}
            placeholder={`${t("all")} - ${t("status")}`}
            noResultsLabel={t("noResults")}
          />
        </div>

        <div className="flex-1">
          <SearchBar
            value={state.search}
            onChange={(value) => {
              state.setSearch(value);
              state.setPage(1);
            }}
          />
        </div>
      </div>

      {state.loading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : (
        <>
          <PaymentTable
            payments={state.payments}
            onRecordPayment={form.openRecordForm}
            t={t}
          />

          <div className="@3xl:hidden space-y-3">
            {state.payments.length === 0 ? (
              <div className="bg-surface rounded-xl border border-surface-border p-6 text-center text-text-muted text-sm">
                {t("noResults")}
              </div>
            ) : (
              state.payments.map((payment) => (
                <PaymentMobileCard
                  key={payment.id}
                  payment={payment}
                  onRecordPayment={form.openRecordForm}
                  t={t}
                />
              ))
            )}
          </div>
        </>
      )}

      <Pagination
        currentPage={state.page}
        totalPages={state.totalPages}
        totalItems={state.totalItems}
        pageSize={state.PAGE_SIZE}
        onPageChange={state.setPage}
      />

      <PaymentRecordModal
        open={Boolean(form.recordForm)}
        t={t}
        form={form.recordForm}
        selectedPayment={selectedPayment}
        actionLoading={state.actionLoading}
        onClose={form.closeRecordForm}
        onSubmit={() => {
          void form.submitRecordForm();
        }}
        onChangeNotes={(notes) => form.updateRecordForm({ notes })}
      />
    </div>
  );
}
