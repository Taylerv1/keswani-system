"use client";

import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";
import customerMock from "@/mocks/customer.mock.json";

/* ---------- Types ---------- */

export interface CustomerUser {
    id: string;
    name: string;
    nameAr: string;
    email: string;
    phone: string;
    address: string;
    addressAr: string;
    subscriptionType: string;
    languagePreference: string;
    accountCreated: string;
    avatar: string | null;
}

export interface RentProperty {
    id: string;
    name: string;
    nameAr: string;
    address: string;
    addressAr: string;
    unitNumber: string;
    type: string;
}

export interface RentContract {
    id: string;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    deposit: number;
    status: string;
    autoRenew: boolean;
}

export interface RentPayment {
    id: string;
    amount: number;
    date: string | null;
    status: string;
    month: string;
    receiptNumber: string | null;
}

export interface MaintenanceRequest {
    id: string;
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
    priority: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface ElectricityReading {
    id: string;
    month: string;
    previousReading: number;
    currentReading: number;
    consumption: number;
    readingDate: string;
    readBy: string;
}

export interface ElectricityBill {
    id: string;
    month: string;
    consumption: number;
    pricePerKwh: number;
    baseAmount: number;
    additionalFees: number;
    totalAmount: number;
    status: string;
    dueDate: string;
    createdAt: string;
}

export interface ElectricityPayment {
    id: string;
    billId: string;
    amount: number;
    date: string;
    collectedBy: string;
}

export interface CustomerReport {
    id: string;
    type: "rent" | "electricity";
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
    note: string | null;
    noteAr: string | null;
    status: string;
    createdAt: string;
}

export interface CustomerData {
    user: CustomerUser;
    rent: {
        property: RentProperty;
        contract: RentContract;
        payments: RentPayment[];
        maintenanceRequests: MaintenanceRequest[];
    } | null;
    electricity: {
        meterId: string;
        meterType: string;
        readings: ElectricityReading[];
        bills: ElectricityBill[];
        payments: ElectricityPayment[];
        currentPricePerKwh: number;
    } | null;
    reports: CustomerReport[];
}

/* ---------- Context ---------- */

interface CustomerContextValue {
    data: CustomerData;
    hasRentData: boolean;
    hasElectricityData: boolean;
    addReport: (report: Omit<CustomerReport, "id" | "createdAt">) => void;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

export function CustomerProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<CustomerData>(() => {
        const raw = customerMock as Record<string, unknown>;
        return {
            user: raw.user as CustomerUser,
            rent: raw.rent ? (raw.rent as CustomerData["rent"]) : null,
            electricity: raw.electricity
                ? (raw.electricity as CustomerData["electricity"])
                : null,
            reports: (raw.reports as CustomerReport[]) ?? [],
        };
    });

    const hasRentData = data.rent !== null;
    const hasElectricityData = data.electricity !== null;

    const addReport = (report: Omit<CustomerReport, "id" | "createdAt">) => {
        const newReport: CustomerReport = {
            ...report,
            id: `rep-${Date.now()}`,
            createdAt: new Date().toISOString().split("T")[0],
        };
        setData((prev) => ({ ...prev, reports: [newReport, ...prev.reports] }));
    };

    return (
        <CustomerContext.Provider
            value={{ data, hasRentData, hasElectricityData, addReport }}
        >
            {children}
        </CustomerContext.Provider>
    );
}

export function useCustomer(): CustomerContextValue {
    const ctx = useContext(CustomerContext);
    if (!ctx) {
        throw new Error("useCustomer must be used within a CustomerProvider");
    }
    return ctx;
}
