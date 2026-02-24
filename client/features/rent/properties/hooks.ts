"use client";

// ============================================================
// Property Module — Hooks
// Combines: usePropertyState + usePropertyForm
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  type CreatePropertyInput,
  type UpdatePropertyInput,
} from "./api";
import type { Property, PropertyDto } from "./types";
import {
  getPropertyOccupancyStatus,
  type CreateUnitInput,
  EMPTY_UNIT,
  sanitizeUnit,
} from "./utils";

// ============================================================
// usePropertyState — Page-level State Hook
// Manages: property list, pagination, filters, search, CRUD calls
// ============================================================

export const PAGE_SIZE = 6;

export type TranslateFn = (key: string) => string;

export function usePropertyState(t: TranslateFn) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);

  /* ------------------------------------------------------------------ */
  /* Fetch                                                               */
  /* ------------------------------------------------------------------ */

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getProperties({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        type: filterType === "all" ? undefined : filterType,
      });

      const items = response.data?.items ?? [];
      const pagination = response.data?.pagination;

      setProperties(items as Property[]);
      setTotalItems(pagination?.total ?? items.length);
      setTotalPages(Math.max(1, pagination?.total_pages ?? 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
      setProperties([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filterType, page, search, t]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  /* ------------------------------------------------------------------ */
  /* CRUD helpers                                                        */
  /* ------------------------------------------------------------------ */

  const getPropertyDetails = useCallback(
    async (id: string) => {
      try {
        setActionLoading(true);
        setError("");

        const response = await getPropertyById(id);
        if (!response.data) return null;

        return {
          dto: response.data,
          ui: response.data as Property,
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : t("error"));
        return null;
      } finally {
        setActionLoading(false);
      }
    },
    [t]
  );

  const createPropertyItem = useCallback(
    async (payload: CreatePropertyInput) => {
      try {
        setActionLoading(true);
        setError("");
        await createProperty(payload);
        await fetchProperties();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : t("error"));
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchProperties, t]
  );

  const updatePropertyItem = useCallback(
    async (id: string, payload: UpdatePropertyInput) => {
      try {
        setActionLoading(true);
        setError("");
        await updateProperty(id, payload);
        await fetchProperties();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : t("error"));
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchProperties, t]
  );

  const deletePropertyItem = useCallback(
    async (id: string) => {
      try {
        setActionLoading(true);
        setError("");
        await deleteProperty(id);
        await fetchProperties();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : t("error"));
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchProperties, t]
  );

  /* ------------------------------------------------------------------ */
  /* Client-side status filter                                           */
  /* ------------------------------------------------------------------ */

  const filtered = useMemo(() => {
    if (filterStatus === "all") return properties;
    return properties.filter(
      (property) => getPropertyOccupancyStatus(property) === filterStatus
    );
  }, [filterStatus, properties]);

  /* ------------------------------------------------------------------ */
  /* Public API                                                          */
  /* ------------------------------------------------------------------ */

  return {
    PAGE_SIZE,
    properties,
    filtered,
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
    filterStatus,
    setFilterStatus,
    page,
    setPage,
    fetchProperties,
    getPropertyDetails,
    createPropertyItem,
    updatePropertyItem,
    deletePropertyItem,
  };
}

// ============================================================
// usePropertyForm — Form + Unit Handling Hook
// Manages: form fields, modal states, unit mutations, save/edit/delete
// ============================================================

type PropertyType = PropertyDto["type"];

interface UsePropertyFormDeps {
  t: TranslateFn;
  getPropertyDetails: (id: string) => Promise<{
    dto: PropertyDto;
    ui: Property;
  } | null>;
  createPropertyItem: (payload: {
    name: string;
    address?: string;
    city?: string;
    type: PropertyType;
    owner_notes?: string;
    units?: CreateUnitInput[];
  }) => Promise<boolean>;
  updatePropertyItem: (
    id: string,
    payload: {
      name?: string;
      address?: string;
      city?: string;
      type?: PropertyType;
      owner_notes?: string | null;
    }
  ) => Promise<boolean>;
  deletePropertyItem: (id: string) => Promise<boolean>;
  setError: (error: string) => void;
}

export function usePropertyForm(deps: UsePropertyFormDeps) {
  const { t, getPropertyDetails, createPropertyItem, updatePropertyItem, deletePropertyItem, setError } = deps;

  /* ------------------------------------------------------------------ */
  /* Modal state                                                         */
  /* ------------------------------------------------------------------ */

  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<Property | null>(null);
  const [editItem, setEditItem] = useState<Property | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [unitModalOpen, setUnitModalOpen] = useState(false);

  /* ------------------------------------------------------------------ */
  /* Form fields                                                         */
  /* ------------------------------------------------------------------ */

  const [form, setForm] = useState({
    name: "",
    type: "building" as PropertyType,
    address: "",
    city: "",
    ownerNotes: "",
  });

  const [units, setUnits] = useState<CreateUnitInput[]>([]);
  const [unitDraft, setUnitDraft] = useState<CreateUnitInput>(EMPTY_UNIT);

  /* ------------------------------------------------------------------ */
  /* Reset                                                               */
  /* ------------------------------------------------------------------ */

  const resetForm = () => {
    setForm({
      name: "",
      type: "building",
      address: "",
      city: "",
      ownerNotes: "",
    });
    setUnits([]);
    setUnitDraft(EMPTY_UNIT);
    setUnitModalOpen(false);
    setEditItem(null);
  };

  /* ------------------------------------------------------------------ */
  /* Open helpers                                                        */
  /* ------------------------------------------------------------------ */

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = async (p: Property) => {
    const details = await getPropertyDetails(p.id);
    if (!details) return;

    const item = details.dto;
    setEditItem(p);
    setForm({
      name: item.name,
      type: item.type,
      address: item.address ?? "",
      city: item.city ?? "",
      ownerNotes: item.owner_notes ?? "",
    });
    setModalOpen(true);
  };

  /* ------------------------------------------------------------------ */
  /* Unit mutations                                                      */
  /* ------------------------------------------------------------------ */

  const ensureHouseUnit = () => {
    setUnits((prev) => (prev.length > 0 ? [prev[0]] : [{ ...EMPTY_UNIT }]));
  };

  const handleUnitTypeChange = (value: PropertyType) => {
    setForm({ ...form, type: value });
    if (value === "house") {
      ensureHouseUnit();
    } else if (value === "building") {
      setUnits((prev) => (prev.length > 1 ? prev : []));
    } else {
      setUnits([]);
    }
  };

  const updateHouseUnit = <K extends keyof CreateUnitInput>(
    key: K,
    value: CreateUnitInput[K]
  ) => {
    setUnits((prev) => {
      const base = prev[0] ?? { ...EMPTY_UNIT };
      return [{ ...base, [key]: value }];
    });
  };

  const addBuildingUnit = () => {
    const sanitized = sanitizeUnit(unitDraft);
    if (!sanitized) {
      setError(t("unitNumber") + " " + t("isRequired"));
      return;
    }
    setUnits((prev) => [...prev, sanitized]);
    setUnitDraft(EMPTY_UNIT);
    setUnitModalOpen(false);
  };

  /* ------------------------------------------------------------------ */
  /* Save (create / update)                                              */
  /* ------------------------------------------------------------------ */

  const handleSave = async () => {
    setError("");

    const nameValue = form.name.trim();
    const addressValue = form.address.trim();
    const cityValue = form.city.trim();

    if (!nameValue) {
      setError(t("propertyName") + " " + t("isRequired"));
      return;
    }

    const payloadType: PropertyType = form.type;
    let success = false;

    if (editItem) {
      success = await updatePropertyItem(editItem.id, {
        name: nameValue,
        address: addressValue || undefined,
        city: cityValue || undefined,
        type: payloadType,
        owner_notes: form.ownerNotes.trim() || null,
      });
    } else {
      const sanitizedUnits = units
        .map((unit) => sanitizeUnit(unit))
        .filter((unit): unit is CreateUnitInput => unit !== null);

      if (payloadType === "house" && sanitizedUnits.length === 0) {
        setError(t("unitNumber") + " " + t("isRequired"));
        return;
      }

      const unitsPayload =
        payloadType === "house"
          ? [sanitizedUnits[0]]
          : payloadType === "building" && sanitizedUnits.length
            ? sanitizedUnits
            : undefined;

      success = await createPropertyItem({
        name: nameValue,
        address: addressValue || undefined,
        city: cityValue || undefined,
        type: payloadType,
        owner_notes: form.ownerNotes.trim() || undefined,
        units: unitsPayload,
      });
    }

    if (!success) return;

    setModalOpen(false);
    resetForm();
  };

  /* ------------------------------------------------------------------ */
  /* View / Delete                                                       */
  /* ------------------------------------------------------------------ */

  const handleView = async (id: string) => {
    const details = await getPropertyDetails(id);
    if (!details) return;
    setDetailModal(details.ui);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const success = await deletePropertyItem(deleteId);
    if (!success) return;
    setDeleteId(null);
  };

  /* ------------------------------------------------------------------ */
  /* Public API                                                          */
  /* ------------------------------------------------------------------ */

  return {
    // modal state
    modalOpen,
    setModalOpen,
    detailModal,
    setDetailModal,
    editItem,
    deleteId,
    setDeleteId,
    unitModalOpen,
    setUnitModalOpen,

    // form fields
    form,
    setForm,
    units,
    unitDraft,
    setUnitDraft,

    // actions
    resetForm,
    openAdd,
    openEdit,
    handleUnitTypeChange,
    updateHouseUnit,
    addBuildingUnit,
    handleSave,
    handleView,
    handleDelete,
  };
}
