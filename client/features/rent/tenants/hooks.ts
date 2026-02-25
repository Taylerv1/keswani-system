"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createTenant,
  deleteTenant,
  getTenantById,
  getTenants,
  updateTenant,
} from "./api";
import type {
  TenantContractFilter,
  TenantDetail,
  TenantFormValues,
  TenantListItem,
} from "./types";
import {
  buildCreateTenantPayload,
  buildUpdateTenantPayload,
  EMPTY_TENANT_FORM,
  extractErrorMessage,
  hydrateTenantForm,
  PAGE_SIZE,
} from "./utils";

export type TranslateFn = (key: string) => string;

export function useTenantState(t: TranslateFn) {
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [contractFilter, setContractFilter] =
    useState<TenantContractFilter>("all");

  const fetchTenantList = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getTenants({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        contract_presence:
          contractFilter === "all" ? undefined : contractFilter,
      });

      const items = response.data?.items ?? [];
      const pagination = response.data?.pagination;

      setTenants(items);
      setTotalItems(pagination?.total ?? items.length);
      setTotalPages(Math.max(1, pagination?.total_pages ?? 1));
    } catch (err) {
      setError(extractErrorMessage(err, t("error")));
      setTenants([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [contractFilter, page, search, t]);

  useEffect(() => {
    void fetchTenantList();
  }, [fetchTenantList]);

  const filteredTenants = tenants;

  const createTenantItem = useCallback(
    async (form: TenantFormValues) => {
      try {
        setActionLoading(true);
        setError("");

        const payload = buildCreateTenantPayload(form);
        await createTenant(payload);

        setPage(1);
        await fetchTenantList();
        return true;
      } catch (err) {
        setError(extractErrorMessage(err, t("error")));
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchTenantList, t]
  );

  const updateTenantItem = useCallback(
    async (id: string, form: TenantFormValues) => {
      try {
        setActionLoading(true);
        setError("");

        const payload = buildUpdateTenantPayload(form);
        await updateTenant(id, payload);

        await fetchTenantList();
        return true;
      } catch (err) {
        setError(extractErrorMessage(err, t("error")));
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchTenantList, t]
  );

  const deleteTenantItem = useCallback(
    async (id: string) => {
      try {
        setActionLoading(true);
        setError("");

        await deleteTenant(id);
        await fetchTenantList();
        return true;
      } catch (err) {
        setError(extractErrorMessage(err, t("error")));
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchTenantList, t]
  );

  const getTenantDetails = useCallback(
    async (id: string): Promise<TenantDetail | null> => {
      try {
        setDetailLoading(true);
        setError("");

        const response = await getTenantById(id);
        return response.data ?? null;
      } catch (err) {
        setError(extractErrorMessage(err, t("error")));
        return null;
      } finally {
        setDetailLoading(false);
      }
    },
    [t]
  );

  return {
    PAGE_SIZE,
    tenants,
    filteredTenants,
    totalItems,
    totalPages,
    loading,
    actionLoading,
    detailLoading,
    error,
    setError,
    search,
    setSearch,
    page,
    setPage,
    contractFilter,
    setContractFilter,
    fetchTenantList,
    createTenantItem,
    updateTenantItem,
    deleteTenantItem,
    getTenantDetails,
  };
}

interface UseTenantFormDeps {
  t: TranslateFn;
  createTenantItem: (form: TenantFormValues) => Promise<boolean>;
  updateTenantItem: (id: string, form: TenantFormValues) => Promise<boolean>;
  deleteTenantItem: (id: string) => Promise<boolean>;
  getTenantDetails: (id: string) => Promise<TenantDetail | null>;
  setError: (error: string) => void;
}

export function useTenantForm({
  t,
  createTenantItem,
  updateTenantItem,
  deleteTenantItem,
  getTenantDetails,
  setError,
}: UseTenantFormDeps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<TenantListItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<TenantDetail | null>(null);

  const [form, setForm] = useState<TenantFormValues>(EMPTY_TENANT_FORM);

  const resetForm = useCallback(() => {
    setForm(EMPTY_TENANT_FORM);
    setEditItem(null);
  }, []);

  const openAdd = useCallback(() => {
    resetForm();
    setModalOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((item: TenantListItem) => {
    setEditItem(item);
    setForm(hydrateTenantForm(item));
    setModalOpen(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setModalOpen(false);
    resetForm();
  }, [resetForm]);

  const handleSave = useCallback(async () => {
    if (!form.full_name.trim()) {
      setError(t("fullNameRequired"));
      return false;
    }

    const success = editItem
      ? await updateTenantItem(editItem.id, form)
      : await createTenantItem(form);

    if (success) {
      closeFormModal();
    }

    return success;
  }, [closeFormModal, createTenantItem, editItem, form, setError, t, updateTenantItem]);

  const openView = useCallback(
    async (item: TenantListItem) => {
      setDetailData({
        id: item.id,
        auth_user_id: null,
        full_name: item.full_name,
        email: item.email,
        phone: item.phone,
        notes: item.notes,
        deleted_at: null,
        created_at: item.created_at,
        updated_at: item.updated_at,
        contracts: [],
        maintenance_requests: [],
      });
      setDetailOpen(true);

      const details = await getTenantDetails(item.id);
      if (details) {
        setDetailData(details);
      }
    },
    [getTenantDetails]
  );

  const closeView = useCallback(() => {
    setDetailOpen(false);
    setDetailData(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return false;

    const success = await deleteTenantItem(deleteId);
    if (success) {
      setDeleteId(null);
    }

    return success;
  }, [deleteId, deleteTenantItem]);

  return {
    modalOpen,
    setModalOpen,
    editItem,
    deleteId,
    setDeleteId,
    detailOpen,
    detailData,
    form,
    setForm,
    resetForm,
    openAdd,
    openEdit,
    closeFormModal,
    handleSave,
    openView,
    closeView,
    handleDelete,
  };
}
