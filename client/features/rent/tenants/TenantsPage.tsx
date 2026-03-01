"use client";

import { FileDown, Plus } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import {
  LoadingLottie,
  Pagination,
  SearchBar,
  SelectMenu,
} from "@/components/ui";
import { useTenantForm, useTenantState } from "./hooks";
import { TenantFormModal } from "./components/TenantFormModal";
import { TenantMobileCard } from "./components/TenantMobileCard";
import { TenantTable } from "./components/TenantTable";
import { TenantViewModal } from "./components/TenantViewModal";

export function TenantsPage() {
  const { t } = useTranslation();

  const state = useTenantState(t);
  const form = useTenantForm({
    t,
    createTenantItem: state.createTenantItem,
    updateTenantItem: state.updateTenantItem,
    deleteTenantItem: state.deleteTenantItem,
    getTenantDetails: state.getTenantDetails,
    setError: state.setError,
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("tenantManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {state.totalItems} {t("totalTenants")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled
            className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium flex items-center gap-2 opacity-60 cursor-not-allowed"
          >
            <FileDown size={16} />
            {t("comingSoon")}
          </button>
          <button
            onClick={form.openAdd}
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            <Plus size={16} />
            {t("addTenant")}
          </button>
        </div>
      </div>

      {state.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar
            value={state.search}
            onChange={(v) => {
              state.setSearch(v);
              state.setPage(1);
            }}
          />
        </div>
        <div className="sm:w-56">
          <SelectMenu
            value={state.contractFilter}
            onChange={(value) => {
              state.setContractFilter(value as "all" | "with_contract" | "without_contract");
              state.setPage(1);
            }}
            options={[
              { value: "all", label: `${t("all")} - ${t("contractStatus")}` },
              { value: "with_contract", label: t("withContract") },
              { value: "without_contract", label: t("withoutContract") },
            ]}
            placeholder={`${t("all")} - ${t("contractStatus")}`}
            noResultsLabel={t("noResults")}
          />
        </div>
      </div>

      {state.loading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center" role="status" aria-live="polite">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
          <TenantTable
            tenants={state.filteredTenants}
            loading={state.loading}
            actionLoading={state.actionLoading}
            onView={(tenant) => void form.openView(tenant)}
            onEdit={form.openEdit}
            t={t}
          />

          <div className="md:hidden space-y-3 p-3">
            {state.filteredTenants.length === 0 ? (
              <div className="bg-surface rounded-xl border border-surface-border p-6 text-center text-text-muted text-sm">
                {t("noResults")}
              </div>
            ) : (
              state.filteredTenants.map((tenant) => (
                <TenantMobileCard
                  key={tenant.id}
                  tenant={tenant}
                  onView={(item) => void form.openView(item)}
                  onEdit={form.openEdit}
                  actionLoading={state.actionLoading}
                  t={t}
                />
              ))
            )}
          </div>
        </div>
      )}

      <Pagination
        currentPage={state.page}
        totalPages={state.totalPages}
        totalItems={state.totalItems}
        pageSize={state.PAGE_SIZE}
        onPageChange={state.setPage}
      />

      <TenantFormModal
        open={form.modalOpen}
        isEdit={Boolean(form.editItem)}
        form={form.form}
        setForm={form.setForm}
        onClose={form.closeFormModal}
        onSave={() => {
          void form.handleSave();
        }}
        actionLoading={state.actionLoading}
        t={t}
      />

      <TenantViewModal
        open={form.detailOpen}
        tenant={form.detailData}
        onClose={form.closeView}
        t={t}
      />
    </div>
  );
}
