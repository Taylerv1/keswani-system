"use client";

import { useMemo, useState } from "react";
import type { MaintenanceFormData, MaintenanceRequest, Property, Tenant } from "./types";
import {
  PAGE_SIZE,
  createEmptyForm,
  filterMaintenanceRequests,
  getPropertyName,
  getTenantName,
} from "./utils";

interface UseMaintenanceStateInput {
  maintenanceRequests: MaintenanceRequest[];
  properties: Property[];
  tenants: Tenant[];
  locale: string;
}

export function useMaintenanceState({
  maintenanceRequests,
  properties,
  tenants,
  locale,
}: UseMaintenanceStateInput) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [page, setPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resolvePropertyName = (id: string) => getPropertyName(properties, id);
  const resolveTenantName = (id: string) => getTenantName(tenants, id, locale);

  return {
    PAGE_SIZE,
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
    totalPages,
    resolvePropertyName,
    resolveTenantName,
  };
}

interface UseMaintenanceFormInput {
  addMaintenance: (request: Omit<MaintenanceRequest, "id">) => void;
  updateMaintenance: (id: string, request: Partial<MaintenanceRequest>) => void;
  removeMaintenance: (id: string) => void;
}

export function useMaintenanceForm({
  addMaintenance,
  updateMaintenance,
  removeMaintenance,
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

  const handleSave = () => {
    if (editItem) {
      updateMaintenance(editItem.id, {
        ...form,
        updatedAt: new Date().toISOString().split("T")[0],
      });
    } else {
      addMaintenance(form);
    }

    setModalOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (!deleteId) return;
    removeMaintenance(deleteId);
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
