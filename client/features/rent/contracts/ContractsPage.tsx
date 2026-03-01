"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import {
  SearchBar,
  Pagination,
  ConfirmDialog,
  LoadingLottie,
  SelectMenu,
  type SelectOption,
} from "@/components/ui";
import { useContractForm, useContractState } from "./hooks";
import { ContractTable } from "./components/ContractTable";
import { ContractMobileCard } from "./components/ContractMobileCard";
import { ContractFormModal } from "./components/ContractFormModal";
import { ContractCreateTenantModal } from "./components/ContractCreateTenantModal";
import { ContractDetailsModal } from "./components/ContractDetailsModal";

export function ContractsPage() {
  const { t } = useTranslation();

  const state = useContractState(t);
  const form = useContractForm({
    t,
    createContractItem: state.createContractItem,
    terminateContractItem: state.terminateContractItem,
    createClientItem: state.createClientItem,
    properties: state.properties,
    setError: state.setError,
  });

  const selectedPropertyUnits = useMemo(() => {
    if (!form.form.property_id) return [];
    const property = state.propertyById.get(form.form.property_id);
    return property?.units ?? [];
  }, [form.form.property_id, state.propertyById]);

  const selectedProperty = useMemo(() => {
    if (!form.form.property_id) return null;
    return state.propertyById.get(form.form.property_id) ?? null;
  }, [form.form.property_id, state.propertyById]);

  const isHouseProperty = selectedProperty?.type === "house";

  const tenantOptions = useMemo(
    () =>
      state.clients.map((tenant) => ({
        value: tenant.id,
        label: tenant.full_name,
      })),
    [state.clients]
  );

  const propertyOptions = useMemo(
    () =>
      state.properties.map((property) => ({
        value: property.id,
        label: property.name,
      })),
    [state.properties]
  );

  const statusFilterOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: `${t("all")} - ${t("status")}` },
      { value: "active", label: t("active") },
      { value: "expired", label: t("expired") },
      { value: "terminated", label: t("terminated") },
    ],
    [t]
  );

  const contractStatusOptions = useMemo<SelectOption[]>(
    () => [
      { value: "pending", label: t("pending") },
      { value: "active", label: t("active") },
      { value: "expired", label: t("expired") },
      { value: "terminated", label: t("terminated") },
    ],
    [t]
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("contractManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {state.totalItems} {t("rentContracts")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={form.openAdd}
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            <Plus size={16} />
            {t("addContract")}
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
            onChange={(value) => {
              state.setSearch(value);
              state.setPage(1);
            }}
          />
        </div>
        <div className="sm:w-52">
          <SelectMenu
            value={state.statusFilter}
            onChange={(value) => {
              state.setStatusFilter(value as "all" | "active" | "expired" | "terminated");
              state.setPage(1);
            }}
            options={statusFilterOptions}
            placeholder={`${t("all")} - ${t("status")}`}
            noResultsLabel={t("noResults")}
          />
        </div>
      </div>

      {state.loading || state.lookupLoading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center" role="status" aria-live="polite">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
          <ContractTable
            contracts={state.contracts}
            t={t}
            onView={form.openView}
            onTerminate={form.setTerminateId}
          />

          <div className="md:hidden space-y-3 p-3">
            {state.contracts.length === 0 ? (
              <div className="bg-surface rounded-xl border border-surface-border p-6 text-center text-text-muted text-sm">
                {t("noResults")}
              </div>
            ) : (
              state.contracts.map((contract) => (
                <ContractMobileCard
                  key={contract.id}
                  contract={contract}
                  t={t}
                  onView={form.openView}
                  onTerminate={form.setTerminateId}
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

      <ContractFormModal
        open={form.modalOpen}
        t={t}
        actionLoading={state.actionLoading}
        form={form.form}
        tenantOptions={tenantOptions}
        propertyOptions={propertyOptions}
        selectedPropertyUnits={selectedPropertyUnits}
        isHouseProperty={isHouseProperty}
        contractStatusOptions={contractStatusOptions}
        onClose={form.closeModal}
        onSave={() => {
          void form.handleSave();
        }}
        onOpenCreateTenant={form.openCreateClientModal}
        onFormChange={form.setForm}
        onPropertyChange={form.onPropertyChange}
      />

      <ContractCreateTenantModal
        open={form.createClientModalOpen}
        t={t}
        actionLoading={state.actionLoading}
        form={form.createClientForm}
        onClose={form.closeCreateClientModal}
        onSubmit={() => {
          void form.handleCreateClient();
        }}
        onFormChange={form.setCreateClientForm}
      />

      <ContractDetailsModal
        open={!!form.detailItem}
        t={t}
        item={form.detailItem}
        onClose={form.closeView}
      />

      <ConfirmDialog
        open={!!form.terminateId}
        onClose={() => form.setTerminateId(null)}
        onConfirm={async () => {
          await form.handleTerminate();
        }}
        loading={state.actionLoading}
        title={t("terminateContract")}
        message={t("terminateContractConfirm")}
        confirmWord={t("cancel")}
        confirmLabel={t("terminate")}
      />
    </div>
  );
}
