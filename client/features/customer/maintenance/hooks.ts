"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCustomerMaintenanceRequest,
  getCustomerMaintenanceRequests,
} from "./api";
import type { CustomerMaintenanceItem, MaintenanceStatus } from "./types";
import { PAGE_SIZE } from "./utils";

export function useCustomerMaintenanceState(
  t: (key: string) => string
) {
  const [items, setItems] = useState<CustomerMaintenanceItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const loadRequests = useCallback(
    async (nextPage?: number) => {
      const targetPage = nextPage ?? page;

      try {
        setLoading(true);
        setError("");
        const response = await getCustomerMaintenanceRequests({
          page: targetPage,
          limit: PAGE_SIZE,
          search: search || undefined,
          status: statusFilter,
        });

        setItems(response.data?.items ?? []);
        setTotalItems(response.data?.pagination.total ?? 0);
        setTotalPages(Math.max(1, response.data?.pagination.total_pages ?? 1));
        if (nextPage && nextPage !== page) setPage(nextPage);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : t("error"));
        setItems([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [page, search, statusFilter, t]
  );

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const submitRequest = useCallback(
    async (payload: {
      title: string;
      description: string;
      estimated_cost?: number;
    }) => {
      try {
        setSubmitLoading(true);
        setError("");
        setSubmitted(false);

        await createCustomerMaintenanceRequest(payload);
        setSubmitted(true);
        await loadRequests(1);
        return true;
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : t("error"));
        return false;
      } finally {
        setSubmitLoading(false);
      }
    },
    [loadRequests, t]
  );

  const hasItems = useMemo(() => items.length > 0, [items.length]);

  return {
    PAGE_SIZE,
    items,
    totalItems,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    loading,
    submitLoading,
    error,
    setError,
    submitted,
    setSubmitted,
    hasItems,
    submitRequest,
  };
}

