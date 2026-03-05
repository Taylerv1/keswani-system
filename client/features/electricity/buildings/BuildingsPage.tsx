"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { Building2, Eye } from "lucide-react";
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
        <Link
          href="/admin-dashboard/rent/properties"
          className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium inline-flex items-center gap-2 hover:bg-background transition-colors"
        >
          {t("rentProperties")}
        </Link>
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
                  <button
                    onClick={() => store.setDetailItem(item)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0"
                  >
                    <Eye size={15} />
                  </button>
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
