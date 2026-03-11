"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/translation";
import { useCustomer } from "@/features/profile/context/customer-context";
import { LoadingLottie, StatusBadge } from "@/components/ui";
import RentHistoryCard from "@/features/rent/components/RentHistoryCard";
import {
    Building2,
    FileText,
    DollarSign,
    Wrench,
} from "lucide-react";

interface MaintenanceHistoryItem {
    id: string;
    title: string;
    titleAr?: string;
    priority: string;
    status: string;
    createdAt: string;
}

function mapBackendStatus(status: string): string {
    if (status === "pending") return "open";
    if (status === "cancelled") return "closed";
    return status;
}

function mapBackendPriority(priority: string): string {
    if (priority === "critical" || priority === "urgent") return "high";
    return priority;
}

export default function RentHistoryPage() {
    const { t, locale } = useTranslation();
    const { data } = useCustomer();
    const rentData = data.rent;
    const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceHistoryItem[]>([]);
    const [maintenanceLoading, setMaintenanceLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const fallbackItems: MaintenanceHistoryItem[] = rentData?.maintenanceRequests.map((item) => ({
            id: item.id,
            title: item.title,
            titleAr: item.titleAr,
            priority: item.priority,
            status: item.status,
            createdAt: item.createdAt,
        })) ?? [];

        const loadMaintenance = async () => {
            if (!rentData) {
                setMaintenanceItems([]);
                return;
            }

            try {
                setMaintenanceLoading(true);
                const response = await fetch("/api/maintenance?page=1&limit=50", {
                    method: "GET",
                    cache: "no-store",
                });
                const payload = await response.json();

                if (cancelled) return;

                if (response.ok && payload?.success && Array.isArray(payload?.data?.items)) {
                    const items = (payload.data.items as Array<Record<string, unknown>>).map((item) => ({
                        id: String(item.id ?? ""),
                        title: String(item.title ?? ""),
                        priority: mapBackendPriority(String(item.priority ?? "medium")),
                        status: mapBackendStatus(String(item.status ?? "pending")),
                        createdAt: String(item.created_at ?? ""),
                    }));

                    setMaintenanceItems(items);
                    return;
                }
            } catch {
                // ignore and fall back to context data
            } finally {
                if (!cancelled) setMaintenanceLoading(false);
            }

            if (!cancelled) {
                setMaintenanceItems(fallbackItems);
            }
        };

        void loadMaintenance();

        return () => {
            cancelled = true;
        };
    }, [rentData]);

    const displayedMaintenance = useMemo(() => maintenanceItems, [maintenanceItems]);

    if (!rentData) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-text-secondary">{t("noData")}</p>
            </div>
        );
    }

    const { property, contract, payments } = rentData;
    const propertyName = locale === "ar" ? property.nameAr : property.name;
    const propertyAddress = locale === "ar" ? property.addressAr : property.address;

    const daysRemaining = Math.max(
        0,
        Math.ceil(
            (new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
    );

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-primary">
                    {t("custRentHistory")}
                </h1>
                <p className="text-text-secondary text-sm mt-1">
                    {t("custRentHistorySubtitle")}
                </p>
            </div>

            {/* Property & Contract Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Current Property */}
                <div className="bg-surface rounded-xl border border-surface-border p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 size={18} className="text-primary" />
                        <h2 className="text-sm font-semibold text-text-primary">
                            {t("custCurrentProperty")}
                        </h2>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-text-muted">{t("propertyName")}</p>
                            <p className="text-sm font-medium text-text-primary">
                                {propertyName}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted">{t("address")}</p>
                            <p className="text-sm text-text-secondary">{propertyAddress}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div>
                                <p className="text-xs text-text-muted">{t("unitNumber")}</p>
                                <p className="text-sm font-medium text-text-primary">
                                    {property.unitNumber}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-text-muted">{t("type")}</p>
                                <p className="text-sm text-text-secondary">
                                    {t(property.type)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contract Details */}
                <div className="bg-surface rounded-xl border border-surface-border p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText size={18} className="text-primary" />
                        <h2 className="text-sm font-semibold text-text-primary">
                            {t("contractDetails")}
                        </h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-text-muted">{t("status")}</span>
                            <StatusBadge status={contract.status} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-text-muted">{t("monthlyRent")}</span>
                            <span className="text-sm font-bold text-text-primary">
                                ${contract.monthlyRent.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-text-muted">{t("deposit")}</span>
                            <span className="text-sm text-text-secondary">
                                ${contract.deposit.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-text-muted">{t("startDate")}</span>
                            <span className="text-sm text-text-secondary">
                                {contract.startDate}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-text-muted">{t("endDate")}</span>
                            <span className="text-sm text-text-secondary">
                                {contract.endDate}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-text-muted">
                                {t("daysRemaining")}
                            </span>
                            <span
                                className={`text-sm font-semibold ${daysRemaining < 90
                                        ? "text-card-red"
                                        : "text-card-green"
                                    }`}
                            >
                                {daysRemaining} {t("custDays")}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-text-muted">{t("autoRenew")}</span>
                            <span className="text-sm text-text-secondary">
                                {contract.autoRenew ? t("yes") : t("no")}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment History */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <DollarSign size={18} className="text-primary" />
                    <h2 className="text-lg font-semibold text-text-primary">
                        {t("paymentHistory")}
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {payments.map((payment) => (
                        <RentHistoryCard key={payment.id} payment={payment} />
                    ))}
                </div>
            </div>

            {/* Maintenance Requests */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Wrench size={18} className="text-primary" />
                    <h2 className="text-lg font-semibold text-text-primary">
                        {t("maintenanceRequests")}
                    </h2>
                </div>
                <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-surface-border bg-background">
                                    <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                                        {t("maintenanceTitle")}
                                    </th>
                                    <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                                        {t("status")}
                                    </th>
                                    <th className="text-start px-4 py-3 font-semibold text-text-secondary">
                                        {t("date")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {maintenanceLoading ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-10">
                                            <div className="flex justify-center">
                                                <LoadingLottie size={240} zoom={1} />
                                            </div>
                                        </td>
                                    </tr>
                                ) : displayedMaintenance.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-text-muted">
                                            {t("noResults")}
                                        </td>
                                    </tr>
                                ) : (
                                    displayedMaintenance.map((req) => (
                                        <tr
                                            key={req.id}
                                            className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors"
                                        >
                                            <td className="px-4 py-3 font-medium text-text-primary">
                                                {locale === "ar" && req.titleAr ? req.titleAr : req.title}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={req.status} />
                                            </td>
                                            <td className="px-4 py-3 text-text-secondary">
                                                {req.createdAt}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
