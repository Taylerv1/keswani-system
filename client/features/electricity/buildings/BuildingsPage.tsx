"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { Building2, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { ConfirmDialog, LoadingLottie, Modal, Pagination, SearchBar } from "@/components/ui";
import { PropertyCreateModal } from "@/features/rent/properties/components/PropertyCreateModal";
import { PropertyEditModal } from "@/features/rent/properties/components/PropertyEditModal";
import { buildingsStore } from "./store";

function useMobxRender() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const dispose = autorun(() => {
      void buildingsStore.observerSnapshot;
      setTick((prev) => prev + 1);
    });

    return () => dispose();
  }, []);
}

export default function BuildingsPage() {
  const { t } = useTranslation();
  const store = buildingsStore;

  useMobxRender();

  useEffect(() => {
    void store.bootstrap(t("error"));
  }, [store, t]);

  const subtitle = `${store.totalItems} ${t("elecBuildings")}`;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t("buildingManagement")}
          </h1>
          <p className="text-text-secondary text-sm mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={store.openAdd}
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            <Plus size={16} />
            {t("addProperty")}
          </button>
          <Link
            href="/admin-dashboard/rent/properties"
            className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium inline-flex items-center gap-2 hover:bg-background transition-colors"
          >
            {t("rentProperties")}
          </Link>
        </div>
      </div>

      {store.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {store.error}
        </div>
      )}
      {store.success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {store.success}
        </div>
      )}

      <div className="mb-5">
        <SearchBar
          value={store.search}
          onChange={(value) => {
            store.setSearch(value);
            void store.loadBuildings({ errorFallback: t("error") });
          }}
        />
      </div>

      {store.loading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {store.items.length === 0 ? (
            <div className="col-span-full bg-surface rounded-xl border border-surface-border p-8 text-center text-text-muted">
              {t("noResults")}
            </div>
          ) : (
            store.items.map((item) => (
              <div
                key={item.id}
                className="bg-surface rounded-xl border border-surface-border p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-card-blue-light text-card-blue flex items-center justify-center">
                    <Building2 size={20} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => store.setDetailItem(item)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => void store.openEdit(item, { errorFallback: t("error") })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => store.setDeleteId(item.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-text-primary">
                  {item.name}
                </h3>
                <p className="text-xs text-text-muted mt-0.5 mb-3">
                  {[item.address, item.city].filter(Boolean).join(", ") || "-"}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-background rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-text-primary">
                      {item.total_units}
                    </p>
                    <p className="text-xs text-text-muted">{t("units")}</p>
                  </div>
                  <div className="bg-background rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-card-blue">
                      {item.subscriber_count}
                    </p>
                    <p className="text-xs text-text-muted">
                      {t("elecSubscribers")}
                    </p>
                  </div>
                  <div className="bg-background rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-card-orange">
                      {item.total_consumption_kwh.toFixed(0)}
                    </p>
                    <p className="text-xs text-text-muted">{t("kwh")}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Pagination
        currentPage={store.page}
        totalPages={store.totalPages}
        totalItems={store.totalItems}
        pageSize={store.PAGE_SIZE}
        onPageChange={(nextPage) => {
          store.setPage(nextPage);
          void store.loadBuildings({
            errorFallback: t("error"),
            targetPage: nextPage,
          });
        }}
      />

      {store.editItem ? (
        store.modalLoading ? (
          <Modal
            open={store.modalOpen}
            onClose={store.closeModal}
            title={t("editProperty")}
            maxWidth="max-w-xl"
          >
            <div className="py-10 flex justify-center">
              <LoadingLottie size={120} className="p-4" />
            </div>
          </Modal>
        ) : (
          <PropertyEditModal
            open={store.modalOpen}
            onClose={store.closeModal}
            form={store.form}
            setForm={store.setForm}
            units={store.units}
            setUnits={store.setUnits}
            onSave={() =>
              void store.save({
                propertyNameRequiredMessage: `${t("propertyName")} ${t("isRequired")}`,
                usageRequiredMessage:
                  "Property must be enabled for rent, electricity, or both",
                successMessage: "Building updated successfully",
                errorFallback: t("error"),
              })
            }
            actionLoading={store.actionLoading}
            t={t}
          />
        )
      ) : (
        <PropertyCreateModal
          open={store.modalOpen}
          onClose={store.closeModal}
          form={store.form}
          setForm={store.setForm}
          units={store.units}
          unitDraft={store.unitDraft}
          setUnitDraft={store.setUnitDraft}
          unitModalOpen={store.unitModalOpen}
          setUnitModalOpen={store.setUnitModalOpen}
          handleUnitTypeChange={store.handleUnitTypeChange}
          updateHouseUnit={store.updateHouseUnit}
          addBuildingUnit={() =>
            store.addBuildingUnit(`${t("unitNumber")} ${t("isRequired")}`)
          }
          onSave={() =>
            void store.save({
              propertyNameRequiredMessage: `${t("propertyName")} ${t("isRequired")}`,
              usageRequiredMessage:
                "Property must be enabled for rent, electricity, or both",
              successMessage: "Building created successfully",
              errorFallback: t("error"),
            })
          }
          actionLoading={store.actionLoading}
          t={t}
        />
      )}

      <Modal
        open={!!store.detailItem}
        onClose={() => store.setDetailItem(null)}
        title={t("buildingDetails")}
        maxWidth="max-w-lg"
      >
        {store.detailItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                [t("buildingName"), store.detailItem.name],
                [
                  t("buildingAddress"),
                  [store.detailItem.address, store.detailItem.city]
                    .filter(Boolean)
                    .join(", ") || "-",
                ],
                [t("propertyType"), store.detailItem.type],
                [t("totalBuildingUnits"), store.detailItem.total_units],
                [t("buildingSubscribers"), store.detailItem.subscriber_count],
                [
                  t("buildingConsumption"),
                  `${store.detailItem.total_consumption_kwh.toFixed(0)} ${t("kwh")}`,
                ],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-background rounded-lg p-3">
                  <p className="text-xs text-text-muted">{label}</p>
                  <p className="text-sm font-medium text-text-primary">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(store.deleteId)}
        onClose={() => store.setDeleteId(null)}
        onConfirm={() =>
          void store.removeSelected({
            errorFallback: t("error"),
            successMessage: "Building deleted successfully",
          })
        }
        loading={store.actionLoading}
      />
    </div>
  );
}
