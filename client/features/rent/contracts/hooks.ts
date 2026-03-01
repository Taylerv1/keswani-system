"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createContractClient,
  createContract,
  terminateContract,
} from "./api";
import type {
  ContractClientFormValues,
  ClientLookupItem,
  ContractFormValues,
  ContractListItem,
  ContractStatusFilter,
  CreateContractClientInput,
  PropertyLookupItem,
} from "./types";
import {
  buildCreateContractClientPayload,
  buildCreateContractPayload,
  EMPTY_CONTRACT_CLIENT_FORM,
  EMPTY_CONTRACT_FORM,
  extractErrorMessage,
  findContractPropertyId,
  PAGE_SIZE,
} from "./utils";
import { rentStore } from "../store";

export type TranslateFn = (key: string) => string;

export function useContractState(t: TranslateFn) {
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [properties, setProperties] = useState<PropertyLookupItem[]>([]);
  const [clients, setClients] = useState<ClientLookupItem[]>([]);

  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ContractStatusFilter>("all");
  const [page, setPage] = useState(1);

  const fetchContractList = useCallback(async (options?: { force?: boolean }) => {
    const query = {
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
    };

    if (!options?.force) {
      const cached = rentStore.getContractsSnapshot(query);
      if (cached) {
        setError("");
        setContracts(cached.items);
        setTotalItems(cached.totalItems);
        setTotalPages(cached.totalPages);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await rentStore.loadContracts(query, {
        force: options?.force,
      });

      setContracts(data.items);
      setTotalItems(data.totalItems);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(extractErrorMessage(err, t("error")));
      setContracts([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, t]);

  const fetchLookups = useCallback(async (options?: { force?: boolean }) => {
    if (!options?.force) {
      const cached = rentStore.getContractLookupsSnapshot();
      if (cached) {
        setProperties(cached.properties);
        setClients(cached.clients);
        setLookupLoading(false);
        return;
      }
    }

    try {
      setLookupLoading(true);
      const { data } = await rentStore.loadContractLookups({
        force: options?.force,
      });
      setProperties(data.properties);
      setClients(data.clients);
    } catch (err) {
      setError(extractErrorMessage(err, t("error")));
      setProperties([]);
      setClients([]);
    } finally {
      setLookupLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchContractList();
  }, [fetchContractList]);

  useEffect(() => {
    void fetchLookups();
  }, [fetchLookups]);

  const createContractItem = useCallback(
    async (form: ContractFormValues) => {
      try {
        setActionLoading(true);
        setError("");

        await createContract(buildCreateContractPayload(form));
        rentStore.invalidateContracts();
        rentStore.invalidateTenants();
        rentStore.invalidateProperties();
        rentStore.invalidateOverview();
        rentStore.invalidateContractLookups();
        setPage(1);
        await fetchContractList({ force: true });
        await fetchLookups({ force: true });
        return true;
      } catch (err) {
        setError(extractErrorMessage(err, t("error")));
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchContractList, fetchLookups, t]
  );

  const terminateContractItem = useCallback(
    async (id: string) => {
      try {
        setActionLoading(true);
        setError("");

        await terminateContract(id);
        rentStore.invalidateContracts();
        rentStore.invalidateTenants();
        rentStore.invalidateProperties();
        rentStore.invalidateOverview();
        rentStore.invalidateContractLookups();
        await fetchContractList({ force: true });
        await fetchLookups({ force: true });
        return true;
      } catch (err) {
        setError(extractErrorMessage(err, t("error")));
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchContractList, fetchLookups, t]
  );

  const createClientItem = useCallback(
    async (payload: CreateContractClientInput): Promise<ClientLookupItem | null> => {
      try {
        setActionLoading(true);
        setError("");

        const response = await createContractClient(payload);
        const created = response.data;
        if (!created) return null;

        const clientLookup: ClientLookupItem = {
          id: created.id,
          full_name: created.full_name,
          email: created.email ?? null,
          phone: created.phone ?? null,
        };

        setClients((prev) => {
          if (prev.some((item) => item.id === clientLookup.id)) return prev;
          return [clientLookup, ...prev];
        });
        rentStore.addContractLookupClient(clientLookup);
        rentStore.invalidateTenants();
        rentStore.invalidateOverview();

        return clientLookup;
      } catch (err) {
        setError(extractErrorMessage(err, t("error")));
        return null;
      } finally {
        setActionLoading(false);
      }
    },
    [t]
  );

  const propertyById = useMemo(() => {
    return new Map(properties.map((property) => [property.id, property]));
  }, [properties]);

  return {
    PAGE_SIZE,
    contracts,
    properties,
    clients,
    propertyById,
    totalItems,
    totalPages,
    loading,
    actionLoading,
    lookupLoading,
    error,
    setError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    fetchContractList,
    fetchLookups,
    createContractItem,
    terminateContractItem,
    createClientItem,
  };
}

interface UseContractFormDeps {
  t: TranslateFn;
  createContractItem: (form: ContractFormValues) => Promise<boolean>;
  terminateContractItem: (id: string) => Promise<boolean>;
  createClientItem: (
    payload: CreateContractClientInput
  ) => Promise<ClientLookupItem | null>;
  properties: PropertyLookupItem[];
  setError: (value: string) => void;
}

export function useContractForm({
  t,
  createContractItem,
  terminateContractItem,
  createClientItem,
  properties,
  setError,
}: UseContractFormDeps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [createClientModalOpen, setCreateClientModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<ContractListItem | null>(null);
  const [terminateId, setTerminateId] = useState<string | null>(null);
  const [form, setForm] = useState<ContractFormValues>(EMPTY_CONTRACT_FORM);
  const [createClientForm, setCreateClientForm] = useState<ContractClientFormValues>(
    EMPTY_CONTRACT_CLIENT_FORM
  );

  const resetForm = useCallback(() => {
    setForm(EMPTY_CONTRACT_FORM);
    setCreateClientForm(EMPTY_CONTRACT_CLIENT_FORM);
    setCreateClientModalOpen(false);
  }, []);

  const openAdd = useCallback(() => {
    resetForm();
    setModalOpen(true);
  }, [resetForm]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    resetForm();
  }, [resetForm]);

  const openCreateClientModal = useCallback(() => {
    setCreateClientForm(EMPTY_CONTRACT_CLIENT_FORM);
    setModalOpen(false);
    setCreateClientModalOpen(true);
  }, []);

  const closeCreateClientModal = useCallback(() => {
    setCreateClientModalOpen(false);
    setCreateClientForm(EMPTY_CONTRACT_CLIENT_FORM);
    setModalOpen(true);
  }, []);

  const openView = useCallback((item: ContractListItem) => {
    setDetailItem(item);
  }, []);

  const closeView = useCallback(() => {
    setDetailItem(null);
  }, []);

  const onPropertyChange = useCallback((propertyId: string) => {
    setForm((prev) => {
      const property = properties.find((item) => item.id === propertyId);
      const isHouseProperty = property?.type === "house";
      const houseUnitId = property?.units[0]?.id ?? "";
      const hasUnit = property?.units.some((unit) => unit.id === prev.unit_id) ?? false;

      return {
        ...prev,
        property_id: propertyId,
        unit_id: isHouseProperty ? houseUnitId : hasUnit ? prev.unit_id : "",
      };
    });
  }, [properties]);

  const availableUnits = useMemo(() => {
    if (!form.property_id) return [];
    const property = properties.find((item) => item.id === form.property_id);
    return property?.units ?? [];
  }, [form.property_id, properties]);

  const handleSave = useCallback(async () => {
    if (!form.client_id || !form.property_id || !form.unit_id) {
      setError(t("error"));
      return false;
    }

    if (!form.start_date) {
      setError(t("error"));
      return false;
    }

    const success = await createContractItem(form);
    if (success) {
      closeModal();
    }
    return success;
  }, [closeModal, createContractItem, form, setError, t]);

  const handleCreateClient = useCallback(async () => {
    if (!createClientForm.full_name.trim()) {
      setError(t("fullNameRequired"));
      return false;
    }

    const created = await createClientItem(
      buildCreateContractClientPayload(createClientForm)
    );

    if (!created) return false;

    setForm((prev) => ({ ...prev, client_id: created.id }));
    setCreateClientModalOpen(false);
    setCreateClientForm(EMPTY_CONTRACT_CLIENT_FORM);
    setModalOpen(true);
    return true;
  }, [createClientForm, createClientItem, setError, t]);

  const handleTerminate = useCallback(async () => {
    if (!terminateId) return false;

    const success = await terminateContractItem(terminateId);
    if (success) {
      setTerminateId(null);
      if (detailItem?.id === terminateId) {
        setDetailItem(null);
      }
    }

    return success;
  }, [detailItem?.id, terminateContractItem, terminateId]);

  const hydratePropertyFromDetail = useCallback(() => {
    if (!detailItem) return;

    const propertyId = findContractPropertyId(detailItem);
    const propertyExists = properties.some((property) => property.id === propertyId);
    if (!propertyExists) return;

    setForm((prev) => ({
      ...prev,
      property_id: propertyId,
    }));
  }, [detailItem, properties]);

  return {
    modalOpen,
    setModalOpen,
    createClientModalOpen,
    setCreateClientModalOpen,
    detailItem,
    setDetailItem,
    terminateId,
    setTerminateId,
    form,
    setForm,
    createClientForm,
    setCreateClientForm,
    resetForm,
    openAdd,
    closeModal,
    openCreateClientModal,
    closeCreateClientModal,
    openView,
    closeView,
    onPropertyChange,
    availableUnits,
    handleSave,
    handleCreateClient,
    handleTerminate,
    hydratePropertyFromDetail,
  };
}
