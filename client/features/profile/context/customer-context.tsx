"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";

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
    loading: boolean;
    error: string | null;
    addReport: (report: Omit<CustomerReport, "id" | "createdAt">) => void;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

export function CustomerProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<CustomerData>(() => {
        // Initialize with empty/default data to avoid relying on mock files
        return {
            user: {
                id: "",
                name: "",
                nameAr: "",
                email: "",
                phone: "",
                address: "",
                addressAr: "",
                subscriptionType: "",
                languagePreference: "en",
                accountCreated: new Date().toISOString().split("T")[0],
                avatar: null,
            },
            rent: null,
            electricity: null,
            reports: [],
        };
    });

    // Real-data loader: try fetching from API, fall back to mock
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadRealData() {
            try {
                const res = await fetch("/api/customer/dashboard", { cache: "no-store" });
                const payload = await res.json();

                if (!res.ok) throw new Error(`HTTP ${res.status}: ${payload?.error || "Unknown error"}`);

                // Backend returns: { success: true, data: { user, rent, electricity, reports } }
                if (payload?.success && payload?.data && !cancelled) {
                    setData({
                        user: payload.data.user,
                        rent: payload.data.rent || null,
                        electricity: payload.data.electricity || null,
                        reports: payload.data.reports || [],
                    });
                    setError(null);
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                if (!cancelled) setError(msg || "Failed to load profile");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadRealData();

        return () => {
            cancelled = true;
        };
    }, []);

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
            value={{ data, hasRentData, hasElectricityData, loading, error, addReport }}
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
