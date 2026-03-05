"use client";

import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { Gauge, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import {
  ConfirmDialog,
  LoadingLottie,
  Modal,
  Pagination,
  SearchBar,
  StatusBadge,
} from "@/components/ui";
import { metersStore } from "./store";

function useMobxRender() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const dispose = autorun(() => {
      void metersStore.observerSnapshot;
      setTick((prev) => prev + 1);
    });

    return () => dispose();
  }, []);
}

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(locale === "ar" ? "ar-LB" : "en-US");
}

export default function MetersPage() {
  const { t, locale } = useTranslation();
  const store = metersStore;

  useMobxRender();

  useEffect(() => {
    void store.bootstrap(t("error"));
  }, [store, t]);

  const getSubscriberLabel = (subscriberId: string) => {
    const option = store.subscriberOptions.find((item) => item.id === subscriberId);
    if (!option) return "-";
    return `${option.client_name} (${option.subscription_number})`;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("meterManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {store.totalItems} {t("elecMeters")}
          </p>
        </div>
        <button
          onClick={store.openAdd}
          className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
        >
          <Plus size={16} />
          {t("addMeter")}
        </button>
      </div>

      {store.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {store.error}
        </div>
      )}
      {store.success && (
        <div className="mb-4 p-3 rounded-lg bg-card-green-light border border-card-green/20 text-card-green text-sm">
          {store.success}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar
            value={store.search}
            onChange={(value) => {
              store.setSearch(value);
              void store.loadMeters({ errorFallback: t("error") });
            }}
          />
        </div>
        <select
          value={store.filterStatus}
          onChange={(event) => {
            store.setFilterStatus(event.target.value as "all" | "active" | "inactive");
            void store.loadMeters({ errorFallback: t("error") });
          }}
          className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-44"
        >
          <option value="all">
            {t("all")} - {t("status")}
          </option>
          <option value="active">{t("active")}</option>
          <option value="inactive">{t("inactive")}</option>
        </select>
        <select
          value={store.filterType}
          onChange={(event) => {
            store.setFilterType(event.target.value as "all" | "residential" | "commercial");
            void store.loadMeters({ errorFallback: t("error") });
          }}
          className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-52"
        >
          <option value="all">
            {t("all")} - {t("meterType")}
          </option>
          <option value="residential">{t("meterResidential")}</option>
          <option value="commercial">{t("meterCommercial")}</option>
        </select>
      </div>

      {store.loading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-background">
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("meterNumber")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriber")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("meterType")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("status")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("installDate")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("lastReadingDate")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {store.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                      {t("noResults")}
                    </td>
                  </tr>
                ) : (
                  store.items.map((meter) => (
                    <tr
                      key={meter.id}
                      className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Gauge size={14} className="text-text-muted shrink-0" />
                          <span className="font-medium text-text-primary">{meter.meter_number}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {meter.subscriber.client.full_name} ({meter.subscriber.subscription_number})
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-background text-text-secondary">
                          {meter.meter_type === "residential"
                            ? t("meterResidential")
                            : t("meterCommercial")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={meter.status} />
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatDate(meter.installation_date, locale)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatDate(meter.last_reading_date, locale)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => store.openEdit(meter)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0"
                            title={t("edit")}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => store.setDeleteId(meter.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0"
                            title={t("delete")}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-surface-border">
            {store.items.length === 0 ? (
              <div className="px-4 py-8 text-center text-text-muted">{t("noResults")}</div>
            ) : (
              store.items.map((meter) => (
                <div key={meter.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gauge size={14} className="text-text-muted shrink-0" />
                      <span className="font-medium text-text-primary text-sm">{meter.meter_number}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-background text-text-secondary">
                        {meter.meter_type === "residential"
                          ? t("meterResidential")
                          : t("meterCommercial")}
                      </span>
                      <StatusBadge status={meter.status} />
                    </div>
                  </div>
                  <div className="text-xs text-text-secondary">
                    {meter.subscriber.client.full_name} ({meter.subscriber.subscription_number})
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">
                      {t("installDate")}: {formatDate(meter.installation_date, locale)}
                    </span>
                    <span className="text-text-muted">
                      {t("lastReadingDate")}: {formatDate(meter.last_reading_date, locale)}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1 pt-1">
                    <button
                      onClick={() => store.openEdit(meter)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0"
                      title={t("edit")}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => store.setDeleteId(meter.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0"
                      title={t("delete")}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <Pagination
        currentPage={store.page}
        totalPages={store.totalPages}
        totalItems={store.totalItems}
        pageSize={store.PAGE_SIZE}
        onPageChange={(nextPage) => {
          store.setPage(nextPage);
          void store.loadMeters({
            errorFallback: t("error"),
            targetPage: nextPage,
          });
        }}
      />

      <Modal
        open={store.modalOpen}
        onClose={store.closeModal}
        title={store.editItem ? t("editMeter") : t("addMeter")}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {store.error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {store.error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("meterNumber")}</label>
            <input
              value={store.form.meter_number}
              onChange={(event) =>
                store.setForm((prev) => ({ ...prev, meter_number: event.target.value }))
              }
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("linkToSubscriber")}</label>
            <select
              value={store.form.subscriber_id}
              onChange={(event) =>
                store.setForm((prev) => ({ ...prev, subscriber_id: event.target.value }))
              }
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">--</option>
              {store.subscriberOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {getSubscriberLabel(item.id)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("meterType")}</label>
              <select
                value={store.form.meter_type}
                onChange={(event) =>
                  store.setForm((prev) => ({
                    ...prev,
                    meter_type: event.target.value as "residential" | "commercial",
                  }))
                }
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="residential">{t("meterResidential")}</option>
                <option value="commercial">{t("meterCommercial")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("status")}</label>
              <select
                value={store.form.status}
                onChange={(event) =>
                  store.setForm((prev) => ({
                    ...prev,
                    status: event.target.value as "active" | "inactive",
                  }))
                }
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="active">{t("active")}</option>
                <option value="inactive">{t("inactive")}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("installDate")}</label>
            <input
              type="date"
              value={store.form.installation_date}
              onChange={(event) =>
                store.setForm((prev) => ({ ...prev, installation_date: event.target.value }))
              }
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={store.closeModal}
              disabled={store.actionLoading}
              className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("cancel")}
            </button>
            <button
              onClick={() =>
                void store.save({
                  meterNumberRequiredMessage: `${t("meterNumber")} ${t("isRequired")}`,
                  subscriberRequiredMessage: `${t("subscriber")} ${t("isRequired")}`,
                  createdSuccessMessage: t("meterCreatedSuccess"),
                  updatedSuccessMessage: t("meterUpdatedSuccess"),
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

      <ConfirmDialog
        open={Boolean(store.deleteId)}
        onClose={() => store.setDeleteId(null)}
        onConfirm={() =>
          void store.removeSelected({
            errorFallback: t("error"),
            successMessage: t("meterDeletedSuccess"),
          })
        }
        loading={store.actionLoading}
      />
    </div>
  );
}
