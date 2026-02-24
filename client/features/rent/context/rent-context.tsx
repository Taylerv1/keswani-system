"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type {
  RentData,
  Tenant,
  Contract,
  Payment,
  MaintenanceRequest,
  Notification,
} from "@/features/rent/types";
import mockData from "@/mocks/rent.mock.json";

interface RentContextValue {
  data: RentData;
  // Tenants
  addTenant: (t: Omit<Tenant, "id">) => void;
  updateTenant: (id: string, t: Partial<Tenant>) => void;
  removeTenant: (id: string) => void;
  // Contracts
  addContract: (c: Omit<Contract, "id">) => void;
  updateContract: (id: string, c: Partial<Contract>) => void;
  removeContract: (id: string) => void;
  // Payments
  addPayment: (p: Omit<Payment, "id">) => void;
  updatePayment: (id: string, p: Partial<Payment>) => void;
  // Maintenance
  addMaintenance: (m: Omit<MaintenanceRequest, "id">) => void;
  updateMaintenance: (id: string, m: Partial<MaintenanceRequest>) => void;
  removeMaintenance: (id: string) => void;
  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const RentContext = createContext<RentContextValue | null>(null);

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function RentProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RentData>({
    properties: [],
    tenants: [],
    contracts: [],
    payments: [],
    maintenanceRequests: [],
    notifications: [],
  });

  useEffect(() => {
    setData(mockData as unknown as RentData);
  }, []);

  // ---- Tenants ----
  const addTenant = useCallback((t: Omit<Tenant, "id">) => {
    setData((prev) => ({
      ...prev,
      tenants: [...prev.tenants, { ...t, id: `ten-${uid()}` }],
    }));
  }, []);

  const updateTenant = useCallback((id: string, t: Partial<Tenant>) => {
    setData((prev) => ({
      ...prev,
      tenants: prev.tenants.map((x) => (x.id === id ? { ...x, ...t } : x)),
    }));
  }, []);

  const removeTenant = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      tenants: prev.tenants.filter((x) => x.id !== id),
    }));
  }, []);

  // ---- Contracts ----
  const addContract = useCallback((c: Omit<Contract, "id">) => {
    setData((prev) => ({
      ...prev,
      contracts: [...prev.contracts, { ...c, id: `con-${uid()}` }],
    }));
  }, []);

  const updateContract = useCallback((id: string, c: Partial<Contract>) => {
    setData((prev) => ({
      ...prev,
      contracts: prev.contracts.map((x) =>
        x.id === id ? { ...x, ...c } : x
      ),
    }));
  }, []);

  const removeContract = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      contracts: prev.contracts.filter((x) => x.id !== id),
    }));
  }, []);

  // ---- Payments ----
  const addPayment = useCallback((p: Omit<Payment, "id">) => {
    setData((prev) => ({
      ...prev,
      payments: [...prev.payments, { ...p, id: `pay-${uid()}` }],
    }));
  }, []);

  const updatePayment = useCallback((id: string, p: Partial<Payment>) => {
    setData((prev) => ({
      ...prev,
      payments: prev.payments.map((x) => (x.id === id ? { ...x, ...p } : x)),
    }));
  }, []);

  // ---- Maintenance ----
  const addMaintenance = useCallback((m: Omit<MaintenanceRequest, "id">) => {
    setData((prev) => ({
      ...prev,
      maintenanceRequests: [
        ...prev.maintenanceRequests,
        { ...m, id: `maint-${uid()}` },
      ],
    }));
  }, []);

  const updateMaintenance = useCallback(
    (id: string, m: Partial<MaintenanceRequest>) => {
      setData((prev) => ({
        ...prev,
        maintenanceRequests: prev.maintenanceRequests.map((x) =>
          x.id === id ? { ...x, ...m } : x
        ),
      }));
    },
    []
  );

  const removeMaintenance = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      maintenanceRequests: prev.maintenanceRequests.filter(
        (x) => x.id !== id
      ),
    }));
  }, []);

  // ---- Notifications ----
  const markNotificationRead = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((x) =>
        x.id === id ? { ...x, read: true } : x
      ),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((x) => ({ ...x, read: true })),
    }));
  }, []);

  return (
    <RentContext.Provider
      value={{
        data,
        addTenant,
        updateTenant,
        removeTenant,
        addContract,
        updateContract,
        removeContract,
        addPayment,
        updatePayment,
        addMaintenance,
        updateMaintenance,
        removeMaintenance,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </RentContext.Provider>
  );
}

export function useRent(): RentContextValue {
  const ctx = useContext(RentContext);
  if (!ctx) {
    throw new Error("useRent must be used within a RentProvider");
  }
  return ctx;
}
