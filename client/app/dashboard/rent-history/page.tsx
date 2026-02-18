"use client";

import { useTranslation } from "@/lib/translation-context";
import { useCustomer } from "@/modules/customer/customer-context";
import { StatusBadge } from "@/components/ui";
import RentHistoryCard from "@/components/customer/RentHistoryCard";
import {
    Building2,
    FileText,
    Calendar,
    DollarSign,
    Wrench,
    Clock,
} from "lucide-react";

export default function RentHistoryPage() {
    const { t, locale } = useTranslation();
    const { data } = useCustomer();

    if (!data.rent) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-text-secondary">{t("noData")}</p>
            </div>
        );
    }

    const { property, contract, payments, maintenanceRequests } = data.rent;
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
                                        {t("priority")}
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
                                {maintenanceRequests.map((req) => (
                                    <tr
                                        key={req.id}
                                        className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 font-medium text-text-primary">
                                            {locale === "ar" ? req.titleAr : req.title}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={req.priority} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={req.status} />
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary">
                                            {req.createdAt}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
