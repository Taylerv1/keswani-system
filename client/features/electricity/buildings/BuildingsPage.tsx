"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { Building2, Eye, Pencil, Plus } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { LoadingLottie, Modal, Pagination, SearchBar } from "@/components/ui";
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
                      onClick={() => store.openEdit(item)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0"
                    >
                      <Pencil size={15} />
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

      <Modal
        open={store.modalOpen}
        onClose={store.closeModal}
        title={store.editItem ? t("editProperty") : t("addProperty")}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("propertyName")}
            </label>
            <input
              value={store.form.name}
              onChange={(event) => store.setFormField("name", event.target.value)}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("propertyType")}
              </label>
              <select
                value={store.form.type}
                onChange={(event) =>
                  store.setFormField(
                    "type",
                    event.target.value as "building" | "house" | "commercial"
                  )
                }
                className="w-full h-10 rounded-lg border border-surface-border bg-background text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="building">{t("building")}</option>
                <option value="house">{t("house")}</option>
                <option value="commercial">{t("commercial")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("city")}
              </label>
              <input
                value={store.form.city}
                onChange={(event) => store.setFormField("city", event.target.value)}
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("address")}
            </label>
            <input
              value={store.form.address}
              onChange={(event) => store.setFormField("address", event.target.value)}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-surface-border p-3">
            <label className="flex items-center gap-3 text-sm text-text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={store.form.is_for_rent}
                onChange={(event) =>
                  store.setFormField("is_for_rent", event.target.checked)
                }
                className="h-4 w-4 rounded border-surface-border"
              />
              {t("rent")}
            </label>
            <label className="flex items-center gap-3 text-sm text-text-primary opacity-70">
              <input
                type="checkbox"
                checked={store.form.is_for_electricity}
                disabled
                className="h-4 w-4 rounded border-surface-border"
              />
              {t("electricity")}
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t("priceNotes")}
            </label>
            <textarea
              value={store.form.owner_notes}
              onChange={(event) =>
                store.setFormField("owner_notes", event.target.value)
              }
              rows={3}
              className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={store.closeModal}
              className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={() =>
                void store.save({
                  propertyNameRequiredMessage: `${t("propertyName")} ${t("isRequired")}`,
                  usageRequiredMessage: "Select at least one usage",
                  errorFallback: t("error"),
                })
              }
              disabled={store.actionLoading}
              className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {store.actionLoading ? t("saving") : t("save")}
            </button>
          </div>
        </div>
      </Modal>

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
    </div>
  );
}
