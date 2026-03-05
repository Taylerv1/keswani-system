"use client";

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import {
  LoadingLottie,
  Pagination,
  SearchBar,
  SelectMenu,
  type SelectOption,
} from "@/components/ui";
import { useTranslation } from "@/lib/translation";
import { MaintenanceRequestForm } from "@/components/MaintenanceRequestForm";
import { MaintenanceRequestList } from "@/components/MaintenanceRequestList";
import { maintenanceStore } from "@/stores/maintenanceStore";
import type { MaintenanceRequest } from "@/services/maintenanceService";

const PAGE_SIZE = 8;

type StatusFilter = MaintenanceRequest["status"] | "all";

function filterRequests(
  requests: MaintenanceRequest[],
  search: string,
  statusFilter: StatusFilter
) {
  const query = search.trim().toLowerCase();

  let next = requests;

  if (statusFilter !== "all") {
    next = next.filter((item) => item.status === statusFilter);
  }

  if (!query) {
    return next;
  }

  return next.filter((item) => {
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.propertyName.toLowerCase().includes(query) ||
      item.unitNumber.toLowerCase().includes(query)
    );
  });
}

function MaintenancePage() {
  const { t, locale } = useTranslation();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    void maintenanceStore.fetchRequests();
  }, []);

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

  const filteredItems = filterRequests(
    maintenanceStore.requests,
    search,
    statusFilter
  );

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;
  const paginatedItems = filteredItems.slice(offset, offset + PAGE_SIZE);

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

      {maintenanceStore.error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-card-red-light text-card-red text-sm">
          {maintenanceStore.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MaintenanceRequestForm
          loading={maintenanceStore.creating}
          submitted={submitted}
          onSubmit={async (payload) => {
            const created = await maintenanceStore.createRequest(payload);
            if (created) {
              setSubmitted(true);
              setPage(1);
              setSearch("");
              setStatusFilter("all");
            }
            return created;
          }}
          onSubmittedShown={() => setSubmitted(false)}
          t={t}
        />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchBar
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
              />
            </div>

            <div className="sm:w-48">
              <SelectMenu
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value as StatusFilter);
                  setPage(1);
                }}
                options={statusOptions}
                placeholder={`${t("all")} - ${t("status")}`}
                noResultsLabel={t("noResults")}
              />
            </div>
          </div>

          {maintenanceStore.loading ? (
            <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
              <LoadingLottie size={140} className="p-4" />
            </div>
          ) : (
            <>
              <MaintenanceRequestList items={paginatedItems} locale={locale} t={t} />
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default observer(MaintenancePage);
