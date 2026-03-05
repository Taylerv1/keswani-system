"use client";

import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { Plus, Receipt } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import {
  LoadingLottie,
  Modal,
  Pagination,
  SearchBar,
} from "@/components/ui";
import { readingsStore } from "./store";

function useMobxRender() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const dispose = autorun(() => {
      void readingsStore.observerSnapshot;
      setTick((prev) => prev + 1);
    });

    return () => dispose();
  }, []);
}

export default function ReadingsPage() {
  const { t } = useTranslation();
  const store = readingsStore;

  useMobxRender();

  useEffect(() => {
    void store.bootstrap(t("error"));
  }, [store, t]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("readingManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {store.totalItems} {t("elecReadings")}
          </p>
        </div>
        <button
          onClick={store.openAdd}
          className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
        >
          <Plus size={16} />
          {t("addReading")}
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
              void store.loadReadings({ errorFallback: t("error") });
            }}
          />
        </div>
        <select
          value={store.monthFilter}
          onChange={(event) => {
            store.setMonthFilter(event.target.value);
            void store.loadReadings({ errorFallback: t("error") });
          }}
          className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-52"
        >
          <option value="all">
            {t("all")} - {t("month")}
          </option>
          {store.availableMonths.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>

      {store.loading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-background">
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriber")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("meterNumber")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("month")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("previousReading")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("currentReading")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("consumption")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("readBy")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("billGenerated")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {store.items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-text-muted">
                      {t("noResults")}
                    </td>
                  </tr>
                ) : (
                  store.items.map((reading) => (
                    <tr
                      key={reading.id}
                      className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {reading.subscriber_name}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{reading.meter_number}</td>
                      <td className="px-4 py-3 text-text-secondary">{reading.month}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {reading.previous_reading.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {reading.current_reading.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-card-orange">
                        {reading.consumption.toLocaleString()} {t("kwh")}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {reading.recorded_by_name ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold ${
                            reading.bill_generated ? "text-card-green" : "text-card-red"
                          }`}
                        >
                          {reading.bill_generated ? t("yes") : t("no")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!reading.bill_generated && (
                          <button
                            onClick={() =>
                              void store.generateBillForReading(reading.id, {
                                successMessage: t("billGeneratedSuccess"),
                                errorFallback: t("error"),
                              })
                            }
                            disabled={store.actionLoading}
                            className="h-7 px-3 rounded-lg bg-card-blue text-white text-xs font-medium cursor-pointer border-0 hover:bg-card-blue/90 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Receipt size={12} />
                            {t("generateBill")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden divide-y divide-surface-border">
            {store.items.length === 0 ? (
              <div className="px-4 py-8 text-center text-text-muted">{t("noResults")}</div>
            ) : (
              store.items.map((reading) => (
                <div key={reading.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary text-sm">{reading.subscriber_name}</span>
                    <span className="text-xs text-text-muted">{reading.month}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">{reading.meter_number}</span>
                    <span className="font-medium text-card-orange">
                      {reading.consumption.toLocaleString()} {t("kwh")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-background rounded-lg px-2 py-1.5">
                      <span className="text-text-muted">{t("previousReading")}: </span>
                      <span className="text-text-secondary">{reading.previous_reading.toLocaleString()}</span>
                    </div>
                    <div className="bg-background rounded-lg px-2 py-1.5">
                      <span className="text-text-muted">{t("currentReading")}: </span>
                      <span className="text-text-secondary">{reading.current_reading.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-text-muted">{reading.recorded_by_name ?? "-"}</span>
                      <span
                        className={`text-xs font-semibold ${
                          reading.bill_generated ? "text-card-green" : "text-card-red"
                        }`}
                      >
                        {reading.bill_generated ? t("yes") : t("no")}
                      </span>
                    </div>
                    {!reading.bill_generated && (
                      <button
                        onClick={() =>
                          void store.generateBillForReading(reading.id, {
                            successMessage: t("billGeneratedSuccess"),
                            errorFallback: t("error"),
                          })
                        }
                        disabled={store.actionLoading}
                        className="h-7 px-3 rounded-lg bg-card-blue text-white text-xs font-medium cursor-pointer border-0 hover:bg-card-blue/90 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Receipt size={12} />
                        {t("generateBill")}
                      </button>
                    )}
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
          void store.loadReadings({
            errorFallback: t("error"),
            targetPage: nextPage,
          });
        }}
      />

      <Modal
        open={store.modalOpen}
        onClose={store.closeModal}
        title={t("addReading")}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {store.error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {store.error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("elecMeters")}</label>
            <select
              value={store.form.meter_id}
              onChange={(event) =>
                store.setForm((prev) => ({
                  ...prev,
                  meter_id: event.target.value,
                  current_reading:
                    event.target.value === prev.meter_id ? prev.current_reading : 0,
                }))
              }
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">--</option>
              {store.meterOptions.map((meter) => (
                <option key={meter.id} value={meter.id}>
                  {meter.meter_number} - {meter.subscriber.client.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("month")}</label>
            <input
              type="month"
              value={store.form.month}
              onChange={(event) =>
                store.setForm((prev) => ({ ...prev, month: event.target.value }))
              }
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("previousReading")}</label>
              <input
                type="number"
                value={store.previousReadingForForm}
                readOnly
                className="w-full h-10 rounded-lg border border-surface-border bg-background/50 px-3 text-sm text-text-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t("currentReading")}</label>
              <input
                type="number"
                value={store.form.current_reading}
                onChange={(event) =>
                  store.setForm((prev) => ({
                    ...prev,
                    current_reading: Number(event.target.value),
                  }))
                }
                className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {store.form.current_reading > 0 && (
            <div className="bg-card-orange-light rounded-lg p-3 text-center">
              <p className="text-xs text-text-muted">{t("consumption")}</p>
              <p className="text-2xl font-bold text-card-orange">
                {store.consumptionForForm.toLocaleString()} {t("kwh")}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("readBy")}</label>
            <select
              value={store.form.recorded_by}
              onChange={(event) =>
                store.setForm((prev) => ({ ...prev, recorded_by: event.target.value }))
              }
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">--</option>
              {store.employeeOptions.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
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
                  meterRequiredMessage: `${t("meterNumber")} ${t("isRequired")}`,
                  readingValueRequiredMessage: `${t("currentReading")} ${t("isRequired")}`,
                  readingValueTooLowMessage: t("readingValueMustBeGreaterThanPrevious"),
                  createdSuccessMessage: t("readingCreatedSuccess"),
                  errorFallback: t("error"),
                })
              }
              disabled={!store.form.meter_id || store.actionLoading}
              className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {store.actionLoading ? t("saving") : t("save")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
