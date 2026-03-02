"use client";

import { useMemo } from "react";
import { CheckCheck } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import {
  SearchBar,
  Pagination,
  LoadingLottie,
  SelectMenu,
  type SelectOption,
} from "@/components/ui";
import { ContractDetailsModal } from "@/features/rent/contracts/components/ContractDetailsModal";
import { TenantViewModal } from "@/features/rent/tenants/components/TenantViewModal";
import { useNotificationDetails, useNotificationState } from "./hooks";
import { MaintenanceDetailsModal } from "./components/MaintenanceDetailsModal";
import { NotificationCard } from "./components/NotificationCard";
import type { NotificationReadFilter, NotificationTypeFilter } from "./types";

export default function NotificationsPage() {
  const { t, locale } = useTranslation();
  const state = useNotificationState(t);
  const details = useNotificationDetails(t);

  const typeFilterOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: `${t("all")} - ${t("notificationType")}` },
      { value: "late_payment", label: t("latePaymentNotif") },
      { value: "contract_ending", label: t("contractEndingNotif") },
      { value: "maintenance", label: t("maintenanceNotif") },
      { value: "vacant_property", label: t("vacantPropertyNotif") },
    ],
    [t]
  );

  const readFilterOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: t("all") },
      { value: "unread", label: t("unread") },
      { value: "read", label: t("read") },
    ],
    [t]
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("notificationManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {state.unreadCount} {t("unread")}
          </p>
        </div>
        {state.unreadCount > 0 && (
          <button
            type="button"
            onClick={() => {
              void state.markAllNotificationsRead();
            }}
            disabled={state.actionLoading}
            className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-primary hover:border-primary/40 transition-colors text-sm font-medium cursor-pointer flex items-center gap-2"
          >
            <CheckCheck size={16} />
            {t("markAllRead")}
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar
            value={state.search}
            onChange={(value) => {
              state.setSearch(value);
              state.setPage(1);
            }}
          />
        </div>
        <div className="sm:w-52">
          <SelectMenu
            value={state.filterType}
            onChange={(value) => {
              state.setFilterType(value as NotificationTypeFilter);
              state.setPage(1);
            }}
            options={typeFilterOptions}
            placeholder={`${t("all")} - ${t("notificationType")}`}
            noResultsLabel={t("noResults")}
          />
        </div>
        <div className="sm:w-40">
          <SelectMenu
            value={state.filterRead}
            onChange={(value) => {
              state.setFilterRead(value as NotificationReadFilter);
              state.setPage(1);
            }}
            options={readFilterOptions}
            placeholder={t("all")}
            noResultsLabel={t("noResults")}
          />
        </div>
      </div>

      {state.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      {details.detailError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {details.detailError}
        </div>
      )}

      {state.loading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {state.items.length === 0 ? (
              <div className="bg-surface rounded-xl border border-surface-border p-8 text-center text-text-muted">
                {t("noResults")}
              </div>
            ) : (
              state.items.map((item) => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  t={t}
                  viewLoading={details.detailLoadingId === item.id}
                  onView={(target) => {
                    void details.openDetails(target);
                  }}
                  onMarkRead={(id) => {
                    void state.markNotificationRead(id);
                  }}
                />
              ))
            )}
          </div>

          <Pagination
            currentPage={state.page}
            totalPages={state.totalPages}
            totalItems={state.totalItems}
            pageSize={state.PAGE_SIZE}
            onPageChange={state.setPage}
          />
        </>
      )}

      <ContractDetailsModal
        open={!!details.contractDetail}
        t={t}
        item={details.contractDetail}
        onClose={() => details.setContractDetail(null)}
      />

      <TenantViewModal
        open={!!details.tenantDetail}
        tenant={details.tenantDetail}
        onClose={() => details.setTenantDetail(null)}
        t={t}
      />

      <MaintenanceDetailsModal
        open={!!details.maintenanceDetail}
        item={details.maintenanceDetail}
        onClose={() => details.setMaintenanceDetail(null)}
        t={t}
        locale={locale}
      />
    </div>
  );
}
