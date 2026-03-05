"use client";

import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { Eye, FileDown, Mail, Pencil, Plus } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import {
  LoadingLottie,
  Modal,
  Pagination,
  SearchBar,
  StatusBadge,
} from "@/components/ui";
import { subscribersStore } from "./store";

function useMobxRender() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const dispose = autorun(() => {
      void subscribersStore.observerSnapshot;
      setTick((prev) => prev + 1);
    });

    return () => dispose();
  }, []);
}

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === "ar" ? "ar-LB" : "en-US");
}

export default function SubscribersPage() {
  const { t, locale } = useTranslation();
  const store = subscribersStore;

  useMobxRender();

  useEffect(() => {
    void store.bootstrap(t("error"));
  }, [store, t]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("subscriberManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {store.totalItems} {t("elecSubscribers")}
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
            onClick={store.openAdd}
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            <Plus size={16} />
            {t("addSubscriber")}
          </button>
        </div>
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
              void store.loadSubscribers({ errorFallback: t("error") });
            }}
          />
        </div>
        <select
          value={store.filterStatus}
          onChange={(event) => {
            store.setFilterStatus(event.target.value as "all" | "active" | "inactive");
            void store.loadSubscribers({ errorFallback: t("error") });
          }}
          className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-56"
        >
          <option value="all">
            {t("all")} - {t("status")}
          </option>
          <option value="active">{t("active")}</option>
          <option value="inactive">{t("inactive")}</option>
        </select>
      </div>

      {store.loading ? (
        <div className="bg-surface rounded-xl border border-surface-border p-12 flex justify-center">
          <LoadingLottie size={150} className="p-6" />
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-background">
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriberName")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriptionNumber")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriberBuilding")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriberUnit")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriberPhone")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("subscriberEmail")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("status")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {store.subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                      {t("noResults")}
                    </td>
                  </tr>
                ) : (
                  store.subscribers.map((subscriber) => (
                    <tr
                      key={subscriber.id}
                      className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {subscriber.client.full_name}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {subscriber.subscription_number}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {subscriber.property?.name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {subscriber.unit?.unit_number ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {subscriber.client.phone ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {subscriber.client.email ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={subscriber.is_active ? "active" : "inactive"} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => void store.openDetails(subscriber, { errorFallback: t("error") })}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0"
                            title={t("view")}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() =>
                              void store.inviteSubscriberPortalAccess(subscriber, {
                                errorFallback: t("error"),
                                emailRequiredMessage: t("clientEmailRequiredForAccess"),
                                successMessage: t("subscriberAccessInviteSent"),
                              })
                            }
                            disabled={store.actionLoading || !subscriber.client.email}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-green hover:bg-card-green-light transition-colors cursor-pointer bg-transparent border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t("sendAccessLink")}
                          >
                            <Mail size={15} />
                          </button>
                          <button
                            onClick={() => store.openEdit(subscriber)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0"
                            title={t("edit")}
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
          void store.loadSubscribers({
            errorFallback: t("error"),
            targetPage: nextPage,
          });
        }}
      />

      <Modal
        open={store.modalOpen}
        onClose={store.closeModal}
        title={store.editItem ? t("editSubscriber") : t("addSubscriber")}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              value={store.form.full_name}
              onChange={(event) => store.setFormField("full_name", event.target.value)}
              placeholder={t("subscriberName")}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              value={store.form.subscription_number}
              onChange={(event) =>
                store.setFormField("subscription_number", event.target.value)
              }
              placeholder={t("subscriptionNumber")}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              value={store.form.phone}
              onChange={(event) => store.setFormField("phone", event.target.value)}
              placeholder={t("subscriberPhone")}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              value={store.form.email}
              onChange={(event) => store.setFormField("email", event.target.value)}
              placeholder={t("subscriberEmail")}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              value={store.form.property_id}
              onChange={(event) => {
                store.setFormField("property_id", event.target.value);
                store.setFormField("unit_id", "");
              }}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">{t("subscriberBuilding")}</option>
              {store.properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
            <select
              value={store.form.unit_id}
              onChange={(event) => store.setFormField("unit_id", event.target.value)}
              disabled={!store.form.property_id}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">{t("subscriberUnit")}</option>
              {store.unitOptions.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.unit_number}
                </option>
              ))}
            </select>
            <select
              value={store.form.status}
              onChange={(event) =>
                store.setFormField("status", event.target.value as "active" | "inactive")
              }
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="active">{t("active")}</option>
              <option value="inactive">{t("inactive")}</option>
            </select>
          </div>
          <textarea
            value={store.form.notes}
            onChange={(event) => store.setFormField("notes", event.target.value)}
            rows={3}
            placeholder={t("notes")}
            className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
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
                  fullNameRequiredMessage: t("fullNameRequired"),
                  subscriptionRequiredMessage: `${t("subscriptionNumber")} ${t("isRequired")}`,
                  successMessage: store.editItem
                    ? t("subscriberUpdatedSuccess")
                    : t("subscriberCreatedSuccess"),
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
        open={store.detailOpen}
        onClose={() => store.setDetailOpen(false)}
        title={t("subscriberDetails")}
        maxWidth="max-w-2xl"
      >
        {store.detailLoading ? (
          <div className="py-8 flex justify-center">
            <LoadingLottie size={120} className="p-4" />
          </div>
        ) : !store.detailData ? (
          <div className="py-8 text-center text-text-muted text-sm">{t("noData")}</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                [t("subscriberName"), store.detailData.client.full_name],
                [t("subscriptionNumber"), store.detailData.subscription_number],
                [t("subscriberPhone"), store.detailData.client.phone ?? "-"],
                [t("subscriberEmail"), store.detailData.client.email ?? "-"],
                [
                  t("portalAccess"),
                  store.detailData.client.auth_user_id ? t("portalLinked") : t("portalNotLinked"),
                ],
                [t("subscriberBuilding"), store.detailData.property?.name ?? "-"],
                [t("subscriberUnit"), store.detailData.unit?.unit_number ?? "-"],
                [t("status"), t(store.detailData.is_active ? "active" : "inactive")],
                [t("notes"), store.detailData.notes ?? "-"],
                [t("createdAt"), formatDate(store.detailData.created_at, locale)],
                [t("totalAmountBill"), `$${store.detailData.summary.total_billed.toFixed(2)}`],
                [t("totalPaid"), `$${store.detailData.summary.total_paid.toFixed(2)}`],
                [t("totalDebt"), `$${store.detailData.summary.outstanding_balance.toFixed(2)}`],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-background rounded-lg p-3">
                  <p className="text-xs text-text-muted">{label}</p>
                  <p className="text-sm font-medium text-text-primary">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (!store.detailData) return;

                  void store.inviteSubscriberPortalAccess(
                    {
                      id: store.detailData.id,
                      client: {
                        id: store.detailData.client.id,
                        auth_user_id: store.detailData.client.auth_user_id,
                        email: store.detailData.client.email,
                      },
                    },
                    {
                      errorFallback: t("error"),
                      emailRequiredMessage: t("clientEmailRequiredForAccess"),
                      successMessage: t("subscriberAccessInviteSent"),
                    }
                  );
                }}
                disabled={store.actionLoading || !store.detailData.client.email}
                className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-card-green hover:border-card-green transition-colors text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("sendAccessLink")}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
