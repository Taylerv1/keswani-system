"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ContractListItem } from "../contracts/types";
import { getTenantById } from "../tenants/api";
import type { TenantDetail } from "../tenants/types";
import { rentStore } from "../store";
import {
  getContractNotificationDetail,
  getMaintenanceNotificationDetail,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from "./api";
import type {
  MaintenanceNotificationDetail,
  NotificationItem,
  NotificationReadFilter,
  NotificationTypeFilter,
} from "./types";
import {
  extractErrorMessage,
  isTenantRelatedType,
  mapContractDetailToListItem,
  PAGE_SIZE,
} from "./utils";

export type TranslateFn = (key: string) => string;

export function useNotificationState(t: TranslateFn) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<NotificationTypeFilter>("all");
  const [filterRead, setFilterRead] = useState<NotificationReadFilter>("all");
  const [page, setPage] = useState(1);

  const fetchNotificationList = useCallback(
    async (options?: { force?: boolean }) => {
      const query = {
        section: "rent",
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        type: filterType === "all" ? undefined : filterType,
        is_read:
          filterRead === "unread"
            ? "false"
            : filterRead === "read"
              ? "true"
              : undefined,
      } as const;

      if (!options?.force) {
        const cached = rentStore.getNotificationsSnapshot(query);
        if (cached) {
          setError("");
          setItems(cached.items);
          setTotalItems(cached.totalItems);
          setTotalPages(cached.totalPages);
          setLoading(false);
          return;
        }
      }

      try {
        setLoading(true);
        setError("");

        const { data } = await rentStore.loadNotifications(query, {
          force: options?.force,
        });

        setItems(data.items);
        setTotalItems(data.totalItems);
        setTotalPages(data.totalPages);
      } catch (error) {
        setError(extractErrorMessage(error, t("error")));
        setItems([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [filterRead, filterType, page, search, t]
  );

  useEffect(() => {
    void fetchNotificationList({ force: true });
  }, [fetchNotificationList]);

  const markNotificationRead = useCallback(
    async (id: string) => {
      try {
        setActionLoading(true);
        setError("");

        await markNotificationReadApi(id);
        setItems((previous) =>
          previous.map((item) =>
            item.id === id ? { ...item, read: true } : item
          )
        );
        rentStore.invalidateNotifications();
        return true;
      } catch (error) {
        setError(extractErrorMessage(error, t("error")));
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [t]
  );

  const markAllNotificationsRead = useCallback(async () => {
    try {
      setActionLoading(true);
      setError("");

      await markAllNotificationsReadApi("rent");
      setItems((previous) => previous.map((item) => ({ ...item, read: true })));
      rentStore.invalidateNotifications();
      return true;
    } catch (error) {
      setError(extractErrorMessage(error, t("error")));
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [t]);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items]
  );

  return {
    PAGE_SIZE,
    items,
    totalItems,
    totalPages,
    loading,
    actionLoading,
    error,
    setError,
    search,
    setSearch,
    filterType,
    setFilterType,
    filterRead,
    setFilterRead,
    page,
    setPage,
    unreadCount,
    fetchNotificationList,
    markNotificationRead,
    markAllNotificationsRead,
  };
}

export function useNotificationDetails(t: TranslateFn) {
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState("");
  const [contractDetail, setContractDetail] = useState<ContractListItem | null>(
    null
  );
  const [tenantDetail, setTenantDetail] = useState<TenantDetail | null>(null);
  const [maintenanceDetail, setMaintenanceDetail] =
    useState<MaintenanceNotificationDetail | null>(null);

  const clearOpenedDetails = useCallback(() => {
    setContractDetail(null);
    setTenantDetail(null);
    setMaintenanceDetail(null);
  }, []);

  const loadContractDetails = useCallback(
    async (id: string): Promise<ContractListItem | null> => {
      try {
        const response = await getContractNotificationDetail(id);
        if (!response.data) return null;
        return mapContractDetailToListItem(response.data);
      } catch {
        return null;
      }
    },
    []
  );

  const loadTenantDetails = useCallback(
    async (id: string): Promise<TenantDetail | null> => {
      try {
        const response = await getTenantById(id);
        return response.data ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  const loadMaintenanceDetails = useCallback(
    async (id: string): Promise<MaintenanceNotificationDetail | null> => {
      try {
        const response = await getMaintenanceNotificationDetail(id);
        return response.data ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  const openDetails = useCallback(
    async (notification: NotificationItem): Promise<boolean> => {
      if (!notification.relatedId) return false;

      setDetailError("");
      clearOpenedDetails();
      setDetailLoadingId(notification.id);

      try {
        if (notification.type === "contract_ending") {
          const contract = await loadContractDetails(notification.relatedId);
          if (!contract) throw new Error("Contract details not found");
          setContractDetail(contract);
          return true;
        }

        if (notification.type === "maintenance") {
          const request = await loadMaintenanceDetails(notification.relatedId);
          if (!request) throw new Error("Maintenance request details not found");
          setMaintenanceDetail(request);
          return true;
        }

        if (notification.type === "late_payment") {
          if (isTenantRelatedType(notification.relatedType)) {
            const tenant = await loadTenantDetails(notification.relatedId);
            if (tenant) {
              setTenantDetail(tenant);
              return true;
            }
          }

          const contract = await loadContractDetails(notification.relatedId);
          if (contract) {
            const tenant = await loadTenantDetails(contract.client_id);
            if (!tenant) throw new Error("Related tenant not found");

            setTenantDetail(tenant);
            return true;
          }

          const fallbackTenant = await loadTenantDetails(notification.relatedId);
          if (fallbackTenant) {
            setTenantDetail(fallbackTenant);
            return true;
          }

          throw new Error("Related contract or tenant not found");
        }

        setDetailError(t("error"));
        return false;
      } catch (error) {
        setDetailError(extractErrorMessage(error, t("error")));
        return false;
      } finally {
        setDetailLoadingId(null);
      }
    },
    [
      clearOpenedDetails,
      loadContractDetails,
      loadMaintenanceDetails,
      loadTenantDetails,
      t,
    ]
  );

  return {
    detailLoadingId,
    detailError,
    contractDetail,
    setContractDetail,
    tenantDetail,
    setTenantDetail,
    maintenanceDetail,
    setMaintenanceDetail,
    openDetails,
  };
}
