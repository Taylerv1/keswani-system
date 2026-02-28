"use client";

import { Plus, FileDown } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { useRent } from "@/features/rent/context/rent-context";
import { SearchBar, Pagination } from "@/components/ui";
import { useMaintenanceForm, useMaintenanceState } from "./hooks";
import { MaintenanceTable } from "./components/MaintenanceTable";
import { MaintenanceMobileCard } from "./components/MaintenanceMobileCard";
import { MaintenanceCreateModal } from "./components/MaintenanceCreateModal";
import { MaintenanceFormModal } from "./components/MaintenanceFormModal";
import { MaintenanceDeleteModal } from "./components/MaintenanceDeleteModal";
import { LoadingLottie } from "@/components/ui";

export default function MaintenancePage() {
  const { t, locale } = useTranslation();
  const { data } = useRent();

  const state = useMaintenanceState({
    tenants: data.tenants,
    locale,
  });

  const form = useMaintenanceForm({
    createMaintenanceItem: state.createMaintenanceItem,
    updateMaintenanceItem: state.updateMaintenanceItem,
    removeMaintenanceItem: state.removeMaintenanceItem,
    resolveUnitId: state.resolveUnitId,
    setError: state.setError,
  });

  const closeModal = () => {
    form.setModalOpen(false);
    form.resetForm();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("maintenanceManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">{state.totalItems} {t("maintenanceRequests")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => alert("PDF export mock")} className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-primary hover:border-primary/40 transition-colors text-sm font-medium cursor-pointer flex items-center gap-2">
            <FileDown size={16} />
            {t("exportPdf")}
          </button>
          <button onClick={form.openAdd} className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">
            <Plus size={16} />
            {t("addMaintenanceRequest")}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={state.search} onChange={(value) => { state.setSearch(value); state.setPage(1); }} />
        </div>
        <select value={state.filterStatus} onChange={(event) => { state.setFilterStatus(event.target.value); state.setPage(1); }} className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">{t("all")} - {t("status")}</option>
          <option value="open">{t("open")}</option>
          <option value="in_progress">{t("inProgress")}</option>
          <option value="completed">{t("completed")}</option>
          <option value="closed">{t("closed")}</option>
        </select>
        <select value={state.filterPriority} onChange={(event) => { state.setFilterPriority(event.target.value); state.setPage(1); }} className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">{t("all")} - {t("priority")}</option>
          <option value="high">{t("high")}</option>
          <option value="medium">{t("medium")}</option>
          <option value="low">{t("low")}</option>
        </select>
      </div>

      {!state.hasLoadedOnce || state.loading || state.lookupLoading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
          <MaintenanceTable
            requests={state.paginated}
            resolvePropertyName={state.resolvePropertyName}
            resolveTenantName={state.resolveTenantName}
            onEdit={form.openEdit}
            onDelete={form.setDeleteId}
            t={t}
          />

          <div className="md:hidden space-y-3 p-3">
            {state.paginated.length === 0 ? (
              <div className="bg-surface rounded-xl border border-surface-border p-6 text-center text-text-muted text-sm">{t("noResults")}</div>
            ) : (
              state.paginated.map((request) => (
                <MaintenanceMobileCard
                  key={request.id}
                  request={request}
                  propertyName={state.resolvePropertyName(request.propertyId)}
                  onEdit={form.openEdit}
                  onDelete={form.setDeleteId}
                  t={t}
                />
              ))
            )}
          </div>
        </div>
      )}

      {state.error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <Pagination
        currentPage={state.page}
        totalPages={state.totalPages}
        totalItems={state.totalItems}
        pageSize={state.PAGE_SIZE}
        onPageChange={state.setPage}
      />

      {form.editItem ? (
        <MaintenanceFormModal
          open={form.modalOpen}
          onClose={closeModal}
          editItem={form.editItem}
          form={form.form}
          setForm={form.setForm}
          properties={state.propertyOptions}
          tenants={state.tenantOptions}
          locale={locale}
          onSave={form.handleSave}
          error={state.error}
          t={t}
        />
      ) : (
        <MaintenanceCreateModal
          open={form.modalOpen}
          onClose={closeModal}
          form={form.form}
          setForm={form.setForm}
          properties={state.propertyOptions}
          tenants={state.tenantOptions}
          locale={locale}
          onSave={form.handleSave}
          error={state.error}
          t={t}
        />
      )}

      <MaintenanceDeleteModal
        open={!!form.deleteId}
        onClose={() => form.setDeleteId(null)}
        onConfirm={form.handleDelete}
        loading={form.deleteLoading}
      />
    </div>
  );
}
