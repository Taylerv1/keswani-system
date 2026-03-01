"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { updatePayment } from "./api";
import { rentStore } from "../store";
import type {
  PaymentStatusFilter,
  PaymentViewFilter,
  RecordPaymentFormValues,
  RentPaymentItem,
} from "./types";
import {
  extractErrorMessage,
  PAGE_SIZE,
  toNumber,
} from "./utils";

export type TranslateFn = (key: string) => string;

export function usePaymentState(t: TranslateFn) {
  const [payments, setPayments] = useState<RentPaymentItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({
    total_income: 0,
    total_collected: 0,
    total_outstanding: 0,
  });

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [viewFilter, setViewFilter] = useState<PaymentViewFilter>("queue");
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>("all");
  const [page, setPage] = useState(1);

  const fetchPaymentList = useCallback(async (options?: { force?: boolean }) => {
    const query = {
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      view: viewFilter,
    };

    if (!options?.force) {
      const cached = rentStore.getPaymentsSnapshot(query);
      if (cached) {
        setError("");
        setPayments(cached.items);
        setTotalItems(cached.totalItems);
        setTotalPages(cached.totalPages);
        setSummary({
          total_income: toNumber(cached.summary.total_income),
          total_collected: toNumber(cached.summary.total_collected),
          total_outstanding: toNumber(cached.summary.total_outstanding),
        });
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await rentStore.loadPayments(query, {
        force: options?.force,
      });

      setPayments(data.items);
      setTotalItems(data.totalItems);
      setTotalPages(data.totalPages);
      setSummary({
        total_income: toNumber(data.summary.total_income),
        total_collected: toNumber(data.summary.total_collected),
        total_outstanding: toNumber(data.summary.total_outstanding),
      });
    } catch (err) {
      setError(extractErrorMessage(err, t("error")));
      setPayments([]);
      setTotalItems(0);
      setTotalPages(1);
      setSummary({
        total_income: 0,
        total_collected: 0,
        total_outstanding: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, t, viewFilter]);

  useEffect(() => {
    void fetchPaymentList();
  }, [fetchPaymentList]);

  const recordCashPayment = useCallback(
    async (form: RecordPaymentFormValues) => {
      try {
        setActionLoading(true);
        setError("");

        const target = payments.find((payment) => payment.id === form.paymentId);
        if (!target) {
          setError(t("noResults"));
          return false;
        }

        await updatePayment(form.paymentId, {
          status: "paid",
          amount: toNumber(target.amount),
          notes: form.notes.trim() || null,
        });

        rentStore.invalidatePayments();
        rentStore.invalidateOverview();
        await fetchPaymentList({ force: true });
        return true;
      } catch (err) {
        setError(extractErrorMessage(err, t("error")));
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchPaymentList, payments, t]
  );

  return {
    PAGE_SIZE,
    payments,
    totalItems,
    totalPages,
    summary,
    loading,
    actionLoading,
    error,
    setError,
    search,
    setSearch,
    viewFilter,
    setViewFilter,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    fetchPaymentList,
    recordCashPayment,
  };
}

interface UsePaymentFormInput {
  recordCashPayment: (form: RecordPaymentFormValues) => Promise<boolean>;
}

export function usePaymentForm({
  recordCashPayment,
}: UsePaymentFormInput) {
  const [recordForm, setRecordForm] = useState<RecordPaymentFormValues | null>(null);

  const openRecordForm = useCallback((paymentId: string) => {
    setRecordForm({
      paymentId,
      notes: "",
    });
  }, []);

  const closeRecordForm = useCallback(() => {
    setRecordForm(null);
  }, []);

  const updateRecordForm = useCallback(
    (patch: Partial<Omit<RecordPaymentFormValues, "paymentId">>) => {
      setRecordForm((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...patch,
        };
      });
    },
    []
  );

  const submitRecordForm = useCallback(async () => {
    if (!recordForm) return false;

    const success = await recordCashPayment(recordForm);
    if (success) {
      setRecordForm(null);
    }
    return success;
  }, [recordCashPayment, recordForm]);

  const selectedPaymentId = useMemo(() => recordForm?.paymentId ?? null, [recordForm]);

  return {
    recordForm,
    selectedPaymentId,
    openRecordForm,
    closeRecordForm,
    updateRecordForm,
    submitRecordForm,
  };
}
