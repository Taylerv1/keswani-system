"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Eye } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { LoadingLottie, Modal, Pagination, SearchBar } from "@/components/ui";
import {
  type ElectricityBuildingItem,
  getElectricityBuildings,
} from "./api";

const PAGE_SIZE = 6;

export default function BuildingsPage() {
  const { t } = useTranslation();

  const [items, setItems] = useState<ElectricityBuildingItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailItem, setDetailItem] = useState<ElectricityBuildingItem | null>(
    null
  );

  const loadBuildings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getElectricityBuildings({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
      });

      setItems(response.data?.items ?? []);
      setTotalItems(response.data?.pagination.total ?? 0);
      setTotalPages(Math.max(1, response.data?.pagination.total_pages ?? 1));
    } catch (err) {
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }, [page, search, t]);

  useEffect(() => {
    void loadBuildings();
  }, [loadBuildings]);

  const subtitle = useMemo(
    () => `${totalItems} ${t("elecBuildings")}`,
    [totalItems, t]
  );

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

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="mb-5">
        <SearchBar
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
      </div>

      {loading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.length === 0 ? (
            <div className="col-span-full bg-surface rounded-xl border border-surface-border p-8 text-center text-text-muted">
              {t("noResults")}
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-surface rounded-xl border border-surface-border p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-card-blue-light text-card-blue flex items-center justify-center">
                    <Building2 size={20} />
                  </div>
                  <button
                    onClick={() => setDetailItem(item)}
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
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      <Modal
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        title={t("buildingDetails")}
        maxWidth="max-w-lg"
      >
        {detailItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                [t("buildingName"), detailItem.name],
                [
                  t("buildingAddress"),
                  [detailItem.address, detailItem.city]
                    .filter(Boolean)
                    .join(", ") || "-",
                ],
                [t("propertyType"), detailItem.type],
                [t("totalBuildingUnits"), detailItem.total_units],
                [t("buildingSubscribers"), detailItem.subscriber_count],
                [
                  t("buildingConsumption"),
                  `${detailItem.total_consumption_kwh.toFixed(0)} ${t("kwh")}`,
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
