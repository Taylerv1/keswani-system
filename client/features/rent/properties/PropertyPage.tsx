"use client";

// ============================================================
// Property Module — Main Page (orchestration only)
// ============================================================

import { Plus, Building2, Home } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import {
  SearchBar,
  StatusBadge,
  Pagination,
  Modal,
  LoadingLottie,
} from "@/components/ui";
import { usePropertyState } from "./hooks";
import { usePropertyForm } from "./hooks";
import { PropertyTable } from "./components/PropertyTable";
import { PropertyMobileCard } from "./components/PropertyMobileCard";
import { PropertyCreateModal } from "./components/PropertyCreateModal";
import { PropertyEditModal } from "./components/PropertyEditModal";
import { PropertyDeleteModal } from "./components/PropertyDeleteModal";
import {
  getPropertyOccupancyStatus,
  getPropertyAddress,
} from "./utils";

export function PropertyPage() {
  const { t } = useTranslation();

  /* ------------------------------------------------------------------ */
  /* State & form hooks                                                  */
  /* ------------------------------------------------------------------ */

  const state = usePropertyState(t);
  const form = usePropertyForm({
    t,
    getPropertyDetails: state.getPropertyDetails,
    createPropertyItem: state.createPropertyItem,
    updatePropertyItem: state.updatePropertyItem,
    deletePropertyItem: state.deletePropertyItem,
    setError: state.setError,
  });

  /* ------------------------------------------------------------------ */
  /* Derived                                                             */
  /* ------------------------------------------------------------------ */

  const closeModal = () => {
    form.setModalOpen(false);
    form.resetForm();
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t("propertyManagement")}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {state.totalItems} {t("totalProperties")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={form.openAdd}
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            <Plus size={16} />
            {t("addProperty")}
          </button>
        </div>
      </div>

      {state.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      {/* Filters */}
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
        <select
          value={state.filterType}
          onChange={(e) => {
            state.setFilterType(e.target.value);
            state.setPage(1);
          }}
          className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">
            {t("all")} - {t("propertyType")}
          </option>
          <option value="building">{t("building")}</option>
          <option value="house">{t("house")}</option>
          {/* <option value="land">{t("land")}</option> */}
          {/* <option value="commercial">{t("commercial")}</option> */}
        </select>
        <select
          value={state.filterStatus}
          onChange={(e) => {
            state.setFilterStatus(e.target.value);
            state.setPage(1);
          }}
          className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">
            {t("all")} - {t("status")}
          </option>
          <option value="full">{t("full")}</option>
          <option value="vacant">{t("vacant")}</option>
        </select>
      </div>

      {/* Table container */}
      {state.loading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center" role="status" aria-live="polite">
          <LoadingLottie size={110} className="p-2" />
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
          {/* Desktop */}
          <PropertyTable
            properties={state.filtered}
            loading={state.loading}
            actionLoading={state.actionLoading}
            onView={(id) => void form.handleView(id)}
            onEdit={(p) => void form.openEdit(p)}
            onDelete={(id) => form.setDeleteId(id)}
            t={t}
          />

          {/* Mobile cards */}
          <div className="md:hidden space-y-3 p-3">
            {state.filtered.length === 0 ? (
              <div className="bg-surface rounded-xl border border-surface-border p-6 text-center text-text-muted text-sm">
                {t("noResults")}
              </div>
            ) : (
              state.filtered.map((p) => (
                <PropertyMobileCard
                  key={p.id}
                  property={p}
                  onView={(id) => void form.handleView(id)}
                  onEdit={(prop) => void form.openEdit(prop)}
                  onDelete={(id) => form.setDeleteId(id)}
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

      {/* Create / Edit modals */}
      {form.editItem ? (
        <PropertyEditModal
          open={form.modalOpen}
          onClose={closeModal}
          form={form.form}
          setForm={form.setForm}
          units={form.units}
          setUnits={form.setUnits}
          handleUnitTypeChange={form.handleUnitTypeChange}
          onSave={form.handleSave}
          actionLoading={state.actionLoading}
          t={t}
        />
      ) : (
        <PropertyCreateModal
          open={form.modalOpen}
          onClose={closeModal}
          form={form.form}
          setForm={form.setForm}
          units={form.units}
          unitDraft={form.unitDraft}
          setUnitDraft={form.setUnitDraft}
          unitModalOpen={form.unitModalOpen}
          setUnitModalOpen={form.setUnitModalOpen}
          handleUnitTypeChange={form.handleUnitTypeChange}
          updateHouseUnit={form.updateHouseUnit}
          addBuildingUnit={form.addBuildingUnit}
          onSave={form.handleSave}
          actionLoading={state.actionLoading}
          t={t}
        />
      )}

      {/* Detail modal */}
      <Modal
        open={!!form.detailModal}
        onClose={() => form.setDetailModal(null)}
        title={t("propertyDetails")}
        maxWidth="max-w-lg"
      >
        {form.detailModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-card-blue-light text-card-blue flex items-center justify-center">
                {form.detailModal.type === "house" ? (
                  <Home size={28} />
                ) : (
                  <Building2 size={28} />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {form.detailModal.name}
                </h3>
                <p className="text-sm text-text-secondary">
                  {getPropertyAddress(form.detailModal)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("propertyType")}</p>
                <p className="text-sm font-medium text-text-primary">
                  {t(form.detailModal.type)}
                </p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("status")}</p>
                <StatusBadge
                  status={getPropertyOccupancyStatus(form.detailModal)}
                />
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("totalUnits")}</p>
                <p className="text-sm font-medium text-text-primary">
                  {form.detailModal.total_units}
                </p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("rentedUnits")}</p>
                <p className="text-sm font-medium text-card-green">
                  {form.detailModal.rented_units}
                </p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("vacantUnits")}</p>
                <p className="text-sm font-medium text-card-orange">
                  {form.detailModal.available_units}
                </p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{t("manager")}</p>
                <p className="text-sm font-medium text-text-primary">
                  {form.detailModal.manager_name ?? "-"}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <PropertyDeleteModal
        open={!!form.deleteId}
        onClose={() => form.setDeleteId(null)}
        onConfirm={form.handleDelete}
      />
    </div>
  );
}
