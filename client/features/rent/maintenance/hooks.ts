"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createMaintenanceRequest,
  deleteMaintenanceRequest,
  getMaintenanceRequests,
  updateMaintenanceRequest,
} from "./api";
import type { MaintenanceFormData, MaintenanceRequest, Property, Tenant } from "./types";
import {
  PAGE_SIZE,
  createEmptyForm,
  filterMaintenanceRequests,
  getPropertyName,
  getTenantName,
  uiPriorityToBackend,
  uiStatusToBackend,
} from "./utils";

interface UseMaintenanceStateInput {
  properties: Property[];
  tenants: Tenant[];
  locale: string;
}

export function useMaintenanceState({
  properties,
  tenants,
  locale,
}: UseMaintenanceStateInput) {
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMaintenance = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMaintenanceRequests({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status:
          filterStatus === "all"
            ? undefined
            : uiStatusToBackend(filterStatus as "open" | "in_progress" | "completed" | "closed"),
        priority:
          filterPriority === "all"
            ? undefined
            : uiPriorityToBackend(filterPriority as "high" | "medium" | "low"),
      });

      const items = response.data?.items ?? [];
      const pagination = response.data?.pagination;

      setMaintenanceRequests(items);
      setTotalItems(pagination?.total ?? items.length);
      setTotalPages(Math.max(1, pagination?.total_pages ?? 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch maintenance requests");
      setMaintenanceRequests([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filterPriority, filterStatus, page, search]);

  useEffect(() => {
    void fetchMaintenance();
  }, [fetchMaintenance]);

  const filtered = useMemo(
    () =>
      filterMaintenanceRequests(
        maintenanceRequests,
        search,
        filterStatus,
        filterPriority,
        properties,
        tenants,
        locale
      ),
    [
      filterPriority,
      filterStatus,
      locale,
      maintenanceRequests,
      properties,
      search,
      tenants,
    ]
  );

  const paginated = useMemo(() => filtered, [filtered]);

  const propertyNameMap = useMemo(() => {
    const next = new Map<string, string>();
    maintenanceRequests.forEach((item) => {
      if (item.propertyId && item.propertyName) {
        next.set(item.propertyId, item.propertyName);
      }
    });
    return next;
  }, [maintenanceRequests]);

  const tenantNameMap = useMemo(() => {
    const next = new Map<string, string>();
    maintenanceRequests.forEach((item) => {
      if (item.tenantId && item.tenantName) {
        next.set(item.tenantId, item.tenantName);
      }
    });
    return next;
  }, [maintenanceRequests]);

  const resolvePropertyName = (id: string) => {
    const fromContext = getPropertyName(properties, id);
    if (fromContext !== id) return fromContext;
    return propertyNameMap.get(id) || id;
  };

  const resolveTenantName = (id: string) => {
    const fromContext = getTenantName(tenants, id, locale);
    if (fromContext !== id) return fromContext;
    return tenantNameMap.get(id) || id;
  };

  const createMaintenanceItem = useCallback(
    async (payload: {
      unitId: string;
      tenantId?: string;
      title: string;
      description: string;
      priority: "high" | "medium" | "low";
      cost: number | null;
    }) => {
      try {
        setActionLoading(true);
        setError("");
        await createMaintenanceRequest({
          unit_id: payload.unitId,
          requested_by: payload.tenantId || undefined,
          title: payload.title,
          description: payload.description,
          priority: uiPriorityToBackend(payload.priority),
          estimated_cost: payload.cost ?? undefined,
        });
        await fetchMaintenance();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create maintenance request");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchMaintenance]
  );

  const updateMaintenanceItem = useCallback(
    async (
      id: string,
      payload: {
        unitId?: string;
        tenantId?: string;
        title?: string;
        description?: string;
        priority?: "high" | "medium" | "low";
        status?: "open" | "in_progress" | "completed" | "closed";
        cost?: number | null;
      }
    ) => {
      try {
        setActionLoading(true);
        setError("");
        await updateMaintenanceRequest(id, {
          unit_id: payload.unitId,
          requested_by: payload.tenantId ?? null,
          title: payload.title,
          description: payload.description,
          priority: payload.priority ? uiPriorityToBackend(payload.priority) : undefined,
          status: payload.status ? uiStatusToBackend(payload.status) : undefined,
          actual_cost: payload.cost ?? undefined,
        });
        await fetchMaintenance();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update maintenance request");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchMaintenance]
  );

  const removeMaintenanceItem = useCallback(
    async (id: string) => {
      try {
        setActionLoading(true);
        setError("");
        await deleteMaintenanceRequest(id);
        await fetchMaintenance();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete maintenance request");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchMaintenance]
  );

  return {
    PAGE_SIZE,
    loading,
    actionLoading,
    error,
    setError,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    page,
    setPage,
    filtered,
    paginated,
    totalItems,
    totalPages,
    fetchMaintenance,
    resolvePropertyName,
    resolveTenantName,
    createMaintenanceItem,
    updateMaintenanceItem,
    removeMaintenanceItem,
  };
}

interface UseMaintenanceFormInput {
  createMaintenanceItem: (payload: {
    unitId: string;
    tenantId?: string;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    cost: number | null;
  }) => Promise<boolean>;
  updateMaintenanceItem: (
    id: string,
    payload: {
      unitId?: string;
      tenantId?: string;
      title?: string;
      description?: string;
      priority?: "high" | "medium" | "low";
      status?: "open" | "in_progress" | "completed" | "closed";
      cost?: number | null;
    }
  ) => Promise<boolean>;
  removeMaintenanceItem: (id: string) => Promise<boolean>;
  resolveUnitId: (propertyId: string, unitNumber: string) => string | null;
  setError: (error: string) => void;
}

export function useMaintenanceForm({
  createMaintenanceItem,
  updateMaintenanceItem,
  removeMaintenanceItem,
  resolveUnitId,
  setError,
}: UseMaintenanceFormInput) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<MaintenanceRequest | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<MaintenanceFormData>(createEmptyForm());

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditItem(null);
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (request: MaintenanceRequest) => {
    setEditItem(request);
    setForm({
      propertyId: request.propertyId,
      unitNumber: request.unitNumber,
      tenantId: request.tenantId,
      title: request.title,
      titleAr: request.titleAr,
      description: request.description,
      descriptionAr: request.descriptionAr,
      priority: request.priority,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: new Date().toISOString().split("T")[0],
      cost: request.cost,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const unitId = resolveUnitId(form.propertyId, form.unitNumber);
    if (!unitId) {
      setError("Unit not found for selected property and unit number");
      return;
    }

    const title = form.title.trim();
    const description = form.description.trim();

    if (!title || !description) {
      setError("Title and description are required");
      return;
    }

    let success = false;

    if (editItem) {
      success = await updateMaintenanceItem(editItem.id, {
        unitId,
        tenantId: form.tenantId || undefined,
        title,
        description,
        priority: form.priority,
        status: form.status,
        cost: form.cost,
      });
    } else {
      success = await createMaintenanceItem({
        unitId,
        tenantId: form.tenantId || undefined,
        title,
        description,
        priority: form.priority,
        cost: form.cost,
      });
    }

    if (!success) return;

    setModalOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const success = await removeMaintenanceItem(deleteId);
    if (!success) return;
    setDeleteId(null);
  };

  return {
    modalOpen,
    setModalOpen,
    editItem,
    deleteId,
    setDeleteId,
    form,
    setForm,
    resetForm,
    openAdd,
    openEdit,
    handleSave,
    handleDelete,
  };
}
