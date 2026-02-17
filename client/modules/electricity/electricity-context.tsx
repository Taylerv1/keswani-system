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
  ElectricityData,
  ElecSubscriber,
  ElecBuilding,
  ElecMeter,
  ElecReading,
  ElecBill,
  ElecPayment,
  ElecPricing,
  ElecEmployee,
  ElecAlert,
  ElecSettings,
} from "@/modules/electricity/types";
import mockData from "@/mocks/electricity.mock.json";

interface ElectricityContextValue {
  data: ElectricityData;
  // Subscribers
  addSubscriber: (s: Omit<ElecSubscriber, "id">) => void;
  updateSubscriber: (id: string, s: Partial<ElecSubscriber>) => void;
  removeSubscriber: (id: string) => void;
  // Buildings
  addBuilding: (b: Omit<ElecBuilding, "id">) => void;
  updateBuilding: (id: string, b: Partial<ElecBuilding>) => void;
  removeBuilding: (id: string) => void;
  // Meters
  addMeter: (m: Omit<ElecMeter, "id">) => void;
  updateMeter: (id: string, m: Partial<ElecMeter>) => void;
  removeMeter: (id: string) => void;
  // Readings
  addReading: (r: Omit<ElecReading, "id">) => void;
  updateReading: (id: string, r: Partial<ElecReading>) => void;
  // Bills
  addBill: (b: Omit<ElecBill, "id">) => void;
  updateBill: (id: string, b: Partial<ElecBill>) => void;
  // Payments
  addPayment: (p: Omit<ElecPayment, "id">) => void;
  // Pricing
  addPricing: (p: Omit<ElecPricing, "id">) => void;
  updatePricing: (id: string, p: Partial<ElecPricing>) => void;
  // Employees
  addEmployee: (e: Omit<ElecEmployee, "id">) => void;
  updateEmployee: (id: string, e: Partial<ElecEmployee>) => void;
  removeEmployee: (id: string) => void;
  // Alerts
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  // Settings
  updateSettings: (s: Partial<ElecSettings>) => void;
}

const ElectricityContext = createContext<ElectricityContextValue | null>(null);

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const emptySettings: ElecSettings = {
  currency: "USD",
  currencySymbol: "$",
  generatorName: "",
  generatorNameAr: "",
  generatorCapacity: "",
  operatingHours: "",
  billDueDays: 30,
  lateFeePercentage: 5,
  additionalFees: 5,
  additionalFeesLabel: "",
  additionalFeesLabelAr: "",
  pdfShowLogo: true,
  pdfShowQr: false,
  pdfFooterText: "",
  pdfFooterTextAr: "",
};

export function ElectricityProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ElectricityData>({
    subscribers: [],
    buildings: [],
    meters: [],
    readings: [],
    bills: [],
    payments: [],
    pricing: [],
    employees: [],
    alerts: [],
    settings: emptySettings,
  });

  useEffect(() => {
    setData(mockData as unknown as ElectricityData);
  }, []);

  // ---- Subscribers ----
  const addSubscriber = useCallback((s: Omit<ElecSubscriber, "id">) => {
    setData((prev) => ({ ...prev, subscribers: [...prev.subscribers, { ...s, id: `sub-${uid()}` }] }));
  }, []);
  const updateSubscriber = useCallback((id: string, s: Partial<ElecSubscriber>) => {
    setData((prev) => ({ ...prev, subscribers: prev.subscribers.map((x) => (x.id === id ? { ...x, ...s } : x)) }));
  }, []);
  const removeSubscriber = useCallback((id: string) => {
    setData((prev) => ({ ...prev, subscribers: prev.subscribers.filter((x) => x.id !== id) }));
  }, []);

  // ---- Buildings ----
  const addBuilding = useCallback((b: Omit<ElecBuilding, "id">) => {
    setData((prev) => ({ ...prev, buildings: [...prev.buildings, { ...b, id: `bld-${uid()}` }] }));
  }, []);
  const updateBuilding = useCallback((id: string, b: Partial<ElecBuilding>) => {
    setData((prev) => ({ ...prev, buildings: prev.buildings.map((x) => (x.id === id ? { ...x, ...b } : x)) }));
  }, []);
  const removeBuilding = useCallback((id: string) => {
    setData((prev) => ({ ...prev, buildings: prev.buildings.filter((x) => x.id !== id) }));
  }, []);

  // ---- Meters ----
  const addMeter = useCallback((m: Omit<ElecMeter, "id">) => {
    setData((prev) => ({ ...prev, meters: [...prev.meters, { ...m, id: `mtr-${uid()}` }] }));
  }, []);
  const updateMeter = useCallback((id: string, m: Partial<ElecMeter>) => {
    setData((prev) => ({ ...prev, meters: prev.meters.map((x) => (x.id === id ? { ...x, ...m } : x)) }));
  }, []);
  const removeMeter = useCallback((id: string) => {
    setData((prev) => ({ ...prev, meters: prev.meters.filter((x) => x.id !== id) }));
  }, []);

  // ---- Readings ----
  const addReading = useCallback((r: Omit<ElecReading, "id">) => {
    setData((prev) => ({ ...prev, readings: [...prev.readings, { ...r, id: `rdg-${uid()}` }] }));
  }, []);
  const updateReading = useCallback((id: string, r: Partial<ElecReading>) => {
    setData((prev) => ({ ...prev, readings: prev.readings.map((x) => (x.id === id ? { ...x, ...r } : x)) }));
  }, []);

  // ---- Bills ----
  const addBill = useCallback((b: Omit<ElecBill, "id">) => {
    setData((prev) => ({ ...prev, bills: [...prev.bills, { ...b, id: `bill-${uid()}` }] }));
  }, []);
  const updateBill = useCallback((id: string, b: Partial<ElecBill>) => {
    setData((prev) => ({ ...prev, bills: prev.bills.map((x) => (x.id === id ? { ...x, ...b } : x)) }));
  }, []);

  // ---- Payments ----
  const addPayment = useCallback((p: Omit<ElecPayment, "id">) => {
    setData((prev) => ({ ...prev, payments: [...prev.payments, { ...p, id: `epay-${uid()}` }] }));
  }, []);

  // ---- Pricing ----
  const addPricing = useCallback((p: Omit<ElecPricing, "id">) => {
    setData((prev) => ({ ...prev, pricing: [...prev.pricing, { ...p, id: `price-${uid()}` }] }));
  }, []);
  const updatePricing = useCallback((id: string, p: Partial<ElecPricing>) => {
    setData((prev) => ({ ...prev, pricing: prev.pricing.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  }, []);

  // ---- Employees ----
  const addEmployee = useCallback((e: Omit<ElecEmployee, "id">) => {
    setData((prev) => ({ ...prev, employees: [...prev.employees, { ...e, id: `emp-${uid()}` }] }));
  }, []);
  const updateEmployee = useCallback((id: string, e: Partial<ElecEmployee>) => {
    setData((prev) => ({ ...prev, employees: prev.employees.map((x) => (x.id === id ? { ...x, ...e } : x)) }));
  }, []);
  const removeEmployee = useCallback((id: string) => {
    setData((prev) => ({ ...prev, employees: prev.employees.filter((x) => x.id !== id) }));
  }, []);

  // ---- Alerts ----
  const markAlertRead = useCallback((id: string) => {
    setData((prev) => ({ ...prev, alerts: prev.alerts.map((x) => (x.id === id ? { ...x, read: true } : x)) }));
  }, []);
  const markAllAlertsRead = useCallback(() => {
    setData((prev) => ({ ...prev, alerts: prev.alerts.map((x) => ({ ...x, read: true })) }));
  }, []);

  // ---- Settings ----
  const updateSettings = useCallback((s: Partial<ElecSettings>) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...s } }));
  }, []);

  return (
    <ElectricityContext.Provider
      value={{
        data,
        addSubscriber,
        updateSubscriber,
        removeSubscriber,
        addBuilding,
        updateBuilding,
        removeBuilding,
        addMeter,
        updateMeter,
        removeMeter,
        addReading,
        updateReading,
        addBill,
        updateBill,
        addPayment,
        addPricing,
        updatePricing,
        addEmployee,
        updateEmployee,
        removeEmployee,
        markAlertRead,
        markAllAlertsRead,
        updateSettings,
      }}
    >
      {children}
    </ElectricityContext.Provider>
  );
}

export function useElectricity(): ElectricityContextValue {
  const ctx = useContext(ElectricityContext);
  if (!ctx) {
    throw new Error("useElectricity must be used within an ElectricityProvider");
  }
  return ctx;
}
