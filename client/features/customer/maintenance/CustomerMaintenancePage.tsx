"use client";

import { useMemo } from "react";
import {
  LoadingLottie,
  Pagination,
  SearchBar,
  SelectMenu,
  type SelectOption,
} from "@/components/ui";
import { useTranslation } from "@/lib/translation";
import { useCustomerMaintenanceState } from "./hooks";
import { MaintenanceRequestForm } from "./components/MaintenanceRequestForm";
import { MaintenanceRequestList } from "./components/MaintenanceRequestList";
import type { MaintenanceStatus } from "./types";

export default function CustomerMaintenancePage() {
  const { t, locale } = useTranslation();
  const state = useCustomerMaintenanceState(t);

  const statusOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: `${t("all")} - ${t("status")}` },
      { value: "open", label: t("open") },
      { value: "in_progress", label: t("inProgress") },
      { value: "completed", label: t("completed") },
      { value: "closed", label: t("closed") },
    ],
    [t]
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {t("custMaintenanceCenter")}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {t("custMaintenanceSubtitle")}
        </p>
      </div>

      {state.error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-card-red-light text-card-red text-sm">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MaintenanceRequestForm
          loading={state.submitLoading}
          submitted={state.submitted}
          onSubmit={state.submitRequest}
          onSubmittedShown={() => state.setSubmitted(false)}
          t={t}
        />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchBar
                value={state.search}
                onChange={(value) => {
                  state.setSearch(value);
                  state.setPage(1);
                }}
              />
            </div>

            <div className="sm:w-48">
              <SelectMenu
                value={state.statusFilter}
                onChange={(value) => {
                  state.setStatusFilter(value as MaintenanceStatus | "all");
                  state.setPage(1);
                }}
                options={statusOptions}
                placeholder={`${t("all")} - ${t("status")}`}
                noResultsLabel={t("noResults")}
              />
            </div>
          </div>

          {state.loading ? (
            <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
              <LoadingLottie size={140} className="p-4" />
            </div>
          ) : (
            <>
              <MaintenanceRequestList items={state.items} locale={locale} t={t} />
              <Pagination
                currentPage={state.page}
                totalPages={state.totalPages}
                totalItems={state.totalItems}
                pageSize={state.PAGE_SIZE}
                onPageChange={state.setPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

