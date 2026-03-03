"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, FileDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { ConfirmDialog, LoadingLottie, Modal, Pagination, SearchBar, StatusBadge } from "@/components/ui";
import {
  createSubscriber,
  deleteSubscriber,
  getSubscriberById,
  getSubscriberProperties,
  getSubscribers,
  updateSubscriber,
} from "./api";
import type { PropertyLookup, SubscriberDetail, SubscriberListItem } from "./types";

const PAGE_SIZE = 8;

type StatusFilter = "all" | "active" | "inactive";

interface SubscriberFormState {
  full_name: string;
  email: string;
  phone: string;
  subscription_number: string;
  property_id: string;
  unit_id: string;
  status: "active" | "inactive";
  notes: string;
}

const EMPTY_FORM: SubscriberFormState = {
  full_name: "",
  email: "",
  phone: "",
  subscription_number: "",
  property_id: "",
  unit_id: "",
  status: "active",
  notes: "",
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message.trim().length > 0 ? error.message : fallback;

const formatDate = (value: string | null | undefined, locale: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(locale === "ar" ? "ar-LB" : "en-US");
};

export default function SubscribersPage() {
  const { t, locale } = useTranslation();

  const [subscribers, setSubscribers] = useState<SubscriberListItem[]>([]);
  const [properties, setProperties] = useState<PropertyLookup[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<SubscriberListItem | null>(null);
  const [form, setForm] = useState<SubscriberFormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<SubscriberDetail | null>(null);

  const unitOptions = useMemo(
    () => properties.find((property) => property.id === form.property_id)?.units ?? [],
    [properties, form.property_id]
  );

  const loadSubscribers = useCallback(
    async (targetPage?: number) => {
      try {
        setLoading(true);
        setError("");

        const currentPage = targetPage ?? page;
        const response = await getSubscribers({
          page: currentPage,
          limit: PAGE_SIZE,
          search: search || undefined,
          status: filterStatus === "all" ? undefined : filterStatus,
        });

        setSubscribers(response.data?.items ?? []);
        setTotalItems(response.data?.pagination.total ?? 0);
        setTotalPages(response.data?.pagination.total_pages ?? 1);
      } catch (err) {
        setError(getErrorMessage(err, t("error")));
        setSubscribers([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [filterStatus, page, search, t]
  );

  useEffect(() => {
    void loadSubscribers(page);
  }, [loadSubscribers, page]);

  useEffect(() => {
    let mounted = true;
    const loadProperties = async () => {
      try {
        const nextProperties = await getSubscriberProperties();
        if (!mounted) return;
        setProperties(nextProperties);
      } catch {
        if (!mounted) return;
        setProperties([]);
      }
    };
    void loadProperties();
    return () => {
      mounted = false;
    };
  }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item: SubscriberListItem) => {
    setEditItem(item);
    setForm({
      full_name: item.client.full_name,
      email: item.client.email ?? "",
      phone: item.client.phone ?? "",
      subscription_number: item.subscription_number,
      property_id: item.property?.id ?? "",
      unit_id: item.unit?.id ?? "",
      status: item.is_active ? "active" : "inactive",
      notes: item.notes ?? "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditItem(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    const fullName = form.full_name.trim();
    const subscriptionNumber = form.subscription_number.trim();

    if (!fullName) {
      setError(t("fullNameRequired"));
      return;
    }

    if (!subscriptionNumber) {
      setError(`${t("subscriptionNumber")} is required`);
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      if (editItem) {
        await updateSubscriber(editItem.id, {
          full_name: fullName,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          subscription_number: subscriptionNumber,
          property_id: form.property_id || null,
          unit_id: form.unit_id || null,
          is_active: form.status === "active",
          notes: form.notes.trim() || null,
        });
      } else {
        await createSubscriber({
          full_name: fullName,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          subscription_number: subscriptionNumber,
          property_id: form.property_id || undefined,
          unit_id: form.unit_id || undefined,
          is_active: form.status === "active",
          notes: form.notes.trim() || undefined,
        });
      }

      closeModal();
      if (page !== 1) setPage(1);
      await loadSubscribers(1);
    } catch (err) {
      setError(getErrorMessage(err, t("error")));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setActionLoading(true);
      setError("");
      await deleteSubscriber(deleteId);
      setDeleteId(null);
      await loadSubscribers(page);
    } catch (err) {
      setError(getErrorMessage(err, t("error")));
    } finally {
      setActionLoading(false);
    }
  };

  const openDetails = async (item: SubscriberListItem) => {
    try {
      setDetailLoading(true);
      setError("");
      setDetailOpen(true);
      const response = await getSubscriberById(item.id);
      setDetailData(response.data ?? null);
    } catch (err) {
      setError(getErrorMessage(err, t("error")));
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("subscriberManagement")}</h1>
          <p className="text-text-secondary text-sm mt-1">{totalItems} {t("elecSubscribers")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button disabled className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium flex items-center gap-2 opacity-60 cursor-not-allowed">
            <FileDown size={16} />
            {t("comingSoon")}
          </button>
          <button onClick={openAdd} className="h-10 px-4 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all">
            <Plus size={16} />
            {t("addSubscriber")}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} />
        </div>
        <select
          value={filterStatus}
          onChange={(event) => { setFilterStatus(event.target.value as StatusFilter); setPage(1); }}
          className="h-10 rounded-lg border border-surface-border bg-surface text-sm text-text-primary px-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-56"
        >
          <option value="all">{t("all")} - {t("status")}</option>
          <option value="active">{t("active")}</option>
          <option value="inactive">{t("inactive")}</option>
        </select>
      </div>

      {loading ? (
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
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("status")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">{t("noResults")}</td></tr>
                ) : (
                  subscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-text-primary">{subscriber.client.full_name}</td>
                      <td className="px-4 py-3 text-text-secondary">{subscriber.subscription_number}</td>
                      <td className="px-4 py-3 text-text-secondary">{subscriber.property?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-text-secondary">{subscriber.unit?.unit_number ?? "-"}</td>
                      <td className="px-4 py-3 text-text-secondary">{subscriber.client.phone ?? "-"}</td>
                      <td className="px-4 py-3"><StatusBadge status={subscriber.is_active ? "active" : "inactive"} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => void openDetails(subscriber)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0" title={t("view")}><Eye size={15} /></button>
                          <button onClick={() => openEdit(subscriber)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0" title={t("edit")}><Pencil size={15} /></button>
                          <button onClick={() => setDeleteId(subscriber.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0" title={t("delete")}><Trash2 size={15} /></button>
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

      <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} pageSize={PAGE_SIZE} onPageChange={setPage} />

      <Modal open={modalOpen} onClose={closeModal} title={editItem ? t("editSubscriber") : t("addSubscriber")} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input value={form.full_name} onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))} placeholder={t("subscriberName")} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input value={form.subscription_number} onChange={(event) => setForm((prev) => ({ ...prev, subscription_number: event.target.value }))} placeholder={t("subscriptionNumber")} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder={t("subscriberPhone")} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder={t("subscriberEmail")} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select value={form.property_id} onChange={(event) => setForm((prev) => ({ ...prev, property_id: event.target.value, unit_id: "" }))} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">{t("subscriberBuilding")}</option>
              {properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
            </select>
            <select value={form.unit_id} onChange={(event) => setForm((prev) => ({ ...prev, unit_id: event.target.value }))} disabled={!form.property_id} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed">
              <option value="">{t("subscriberUnit")}</option>
              {unitOptions.map((unit) => <option key={unit.id} value={unit.id}>{unit.unit_number}</option>)}
            </select>
            <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as "active" | "inactive" }))} className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="active">{t("active")}</option>
              <option value="inactive">{t("inactive")}</option>
            </select>
          </div>
          <textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} rows={3} placeholder={t("notes")} className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={closeModal} className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors">{t("cancel")}</button>
            <button onClick={() => void handleSave()} disabled={actionLoading} className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{actionLoading ? t("saving") : t("save")}</button>
          </div>
        </div>
      </Modal>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={t("subscriberDetails")} maxWidth="max-w-2xl">
        {detailLoading ? (
          <div className="py-8 flex justify-center"><LoadingLottie size={120} className="p-4" /></div>
        ) : !detailData ? (
          <div className="py-8 text-center text-text-muted text-sm">{t("noData")}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              [t("subscriberName"), detailData.client.full_name],
              [t("subscriptionNumber"), detailData.subscription_number],
              [t("subscriberPhone"), detailData.client.phone ?? "-"],
              [t("subscriberEmail"), detailData.client.email ?? "-"],
              [t("subscriberBuilding"), detailData.property?.name ?? "-"],
              [t("subscriberUnit"), detailData.unit?.unit_number ?? "-"],
              [t("status"), t(detailData.is_active ? "active" : "inactive")],
              [t("notes"), detailData.notes ?? "-"],
              [t("createdAt"), formatDate(detailData.created_at, locale)],
              [t("totalAmountBill"), `$${detailData.summary.total_billed.toFixed(2)}`],
              [t("totalPaid"), `$${detailData.summary.total_paid.toFixed(2)}`],
              [t("totalDebt"), `$${detailData.summary.outstanding_balance.toFixed(2)}`],
            ].map(([label, value]) => (
              <div key={String(label)} className="bg-background rounded-lg p-3">
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-sm font-medium text-text-primary">{value}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => void handleDelete()} loading={actionLoading} />
    </div>
  );
}
