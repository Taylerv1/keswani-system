"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createMaintenanceRequest,
  deleteMaintenanceRequest,
  updateMaintenanceRequest,
} from "./api";
import type { MaintenanceFormData, MaintenanceRequest, PropertyLookup, Tenant } from "./types";
import { rentStore } from "../store";
import {
  PAGE_SIZE,
  createEmptyForm,
  filterMaintenanceRequests,
  getTenantName,
  uiPriorityToBackend,
  uiStatusToBackend,
} from "./utils";

interface UseMaintenanceStateInput {
  tenants: Tenant[];
  locale: string;
}

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asUuid(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return UUID_V4_REGEX.test(trimmed) ? trimmed : undefined;
}

export function useMaintenanceState({
  tenants,
  locale,
}: UseMaintenanceStateInput) {
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [propertyOptions, setPropertyOptions] = useState<PropertyLookup[]>([]);
  const [tenantOptions, setTenantOptions] = useState<Tenant[]>(tenants);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState("");

  const fetchLookupOptions = useCallback(async (options?: { force?: boolean }) => {
    if (!options?.force) {
      const cached = rentStore.getMaintenanceLookupsSnapshot();
      if (cached) {
        setPropertyOptions(cached.properties);
        setTenantOptions(cached.tenants);
        setLookupLoading(false);
        return;
      }
    }

    try {
      setLookupLoading(true);
      const { data } = await rentStore.loadMaintenanceLookups({
        force: options?.force,
      });
      setPropertyOptions(data.properties);
      setTenantOptions(data.tenants);
    } catch {
      setPropertyOptions([]);
      setTenantOptions(tenants);
    } finally {
      setLookupLoading(false);
    }
  }, [tenants]);

  const fetchMaintenance = useCallback(async (options?: { force?: boolean }) => {
    const query = {
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
    };

    if (!options?.force) {
      const cached = rentStore.getMaintenanceSnapshot(query);
      if (cached) {
        setError("");
        setMaintenanceRequests(cached.items);
        setTotalItems(cached.totalItems);
        setTotalPages(cached.totalPages);
        setLoading(false);
        setHasLoadedOnce(true);
        return;
      }
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await rentStore.loadMaintenance(query, {
        force: options?.force,
      });

      setMaintenanceRequests(data.items);
      setTotalItems(data.totalItems);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch maintenance requests");
      setMaintenanceRequests([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, [filterPriority, filterStatus, page, search]);

  useEffect(() => {
    void fetchMaintenance({ force: true });
  }, [fetchMaintenance]);

  useEffect(() => {
    void fetchLookupOptions();
  }, [fetchLookupOptions]);

  const filtered = useMemo(
    () =>
      filterMaintenanceRequests(
        maintenanceRequests,
        search,
        filterStatus,
        filterPriority,
        [],
          tenantOptions,
        locale
      ),
    [
      filterPriority,
      filterStatus,
      locale,
      maintenanceRequests,
      search,
      tenantOptions,
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
    propertyOptions.forEach((item) => {
      next.set(item.id, item.name);
    });
    return next;
  }, [maintenanceRequests, propertyOptions]);

  const tenantNameMap = useMemo(() => {
    const next = new Map<string, string>();
    maintenanceRequests.forEach((item) => {
      if (item.tenantId && item.tenantName) {
        next.set(item.tenantId, item.tenantName);
      }
    });
    return next;
  }, [maintenanceRequests]);

  const resolvePropertyName = (id: string) => propertyNameMap.get(id) || id;

  const resolveTenantName = (id: string) => {
    const fromContext = getTenantName(tenantOptions, id, locale);
    if (fromContext !== id) return fromContext;
    return tenantNameMap.get(id) || id;
  };

  const resolveUnitId = (propertyId: string, unitNumber: string) => {
    const property = propertyOptions.find((item) => item.id === propertyId);
    if (!property) return null;
    if (property.type === "house") {
      return property.units[0]?.id ?? null;
    }
    const normalized = unitNumber.trim().toLowerCase();
    if (!normalized) return null;
    const unit = property.units.find(
      (item) => item.unit_number.trim().toLowerCase() === normalized
    );
    return unit?.id ?? null;
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
          requested_by: asUuid(payload.tenantId),
          title: payload.title,
          description: payload.description,
          priority: uiPriorityToBackend(payload.priority),
          estimated_cost: payload.cost ?? undefined,
        });
        rentStore.invalidateMaintenance();
        rentStore.invalidateOverview();
        await fetchMaintenance({ force: true });
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
          requested_by: asUuid(payload.tenantId) ?? null,
          title: payload.title,
          description: payload.description,
          priority: payload.priority ? uiPriorityToBackend(payload.priority) : undefined,
          status: payload.status ? uiStatusToBackend(payload.status) : undefined,
          actual_cost: payload.cost ?? undefined,
        });
        rentStore.invalidateMaintenance();
        rentStore.invalidateOverview();
        await fetchMaintenance({ force: true });
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
        rentStore.invalidateMaintenance();
        rentStore.invalidateOverview();
        await fetchMaintenance({ force: true });
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
    lookupLoading,
    hasLoadedOnce,
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
    propertyOptions,
    tenantOptions,
    resolvePropertyName,
    resolveTenantName,
    resolveUnitId,
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
  const [viewItem, setViewItem] = useState<MaintenanceRequest | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState<MaintenanceFormData>(createEmptyForm());

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditItem(null);
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openView = (request: MaintenanceRequest) => {
    setViewItem(request);
  };

  const openEdit = (request: MaintenanceRequest) => {
    setEditItem(request);
    setForm({
      propertyId: request.propertyId,
      unitNumber: request.unitNumber,
      tenantId: request.tenantId,
      title: request.title,
      description: request.description,
      priority: request.priority,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: new Date().toISOString().split("T")[0],
      cost: request.cost,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setError("");

    const resolvedUnitId = resolveUnitId(form.propertyId, form.unitNumber);
    const unitId = resolvedUnitId ?? (editItem ? editItem.unitId : null);

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
    if (!deleteId || deleteLoading) return;

    try {
      setDeleteLoading(true);
      const success = await removeMaintenanceItem(deleteId);
      if (!success) return;
      setDeleteId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return {
    modalOpen,
    setModalOpen,
    editItem,
    viewItem,
    setViewItem,
    deleteId,
    deleteLoading,
    setDeleteId,
    form,
    setForm,
    resetForm,
    openAdd,
    openView,
    openEdit,
    handleSave,
    handleDelete,
  };
}
