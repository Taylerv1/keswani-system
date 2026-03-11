"use client";

import { useTranslation } from "@/lib/translation";
import type { CustomerUser } from "@/features/profile/context/customer-context";
import { User, Phone, MapPin, Globe, Calendar, Shield, Info } from "lucide-react";

interface CustomerProfileCardProps {
    user: CustomerUser;
}

export default function CustomerProfileCard({ user }: CustomerProfileCardProps) {
    const { t, locale, dir } = useTranslation();

    const displayName = locale === "ar" ? user?.nameAr ?? "" : user?.name ?? "";
    const displayAddress = locale === "ar" ? user?.addressAr ?? "" : user?.address ?? "";
    const displayInitial = displayName?.charAt(0) ?? "?";

    const subscriptionLabel = t(
        user.subscriptionType === "rent_electricity"
            ? "custSubBoth"
            : user.subscriptionType === "rent"
                ? "custSubRent"
                : "custSubElec"
    );

    const fields = [
        {
            icon: <User size={20} />,
            label: t("name"),
            value: displayName,
            color: "text-card-blue",
            bg: "bg-card-blue-light",
        },
        {
            icon: <Phone size={20} />,
            label: t("phone"),
            value: user.phone,
            color: "text-card-green",
            bg: "bg-card-green-light",
        },
        {
            icon: <MapPin size={20} />,
            label: t("address"),
            value: displayAddress,
            color: "text-card-orange",
            bg: "bg-card-orange-light",
        },
        {
            icon: <Shield size={20} />,
            label: t("custSubscriptionType"),
            value: subscriptionLabel,
            color: "text-card-green",
            bg: "bg-card-green-light",
        },
        {
            icon: <Globe size={20} />,
            label: t("languagePreference"),
            value: user.languagePreference === "en" ? "English" : "العربية",
            color: "text-card-blue",
            bg: "bg-card-blue-light",
        },
        {
            icon: <Calendar size={20} />,
            label: t("accountCreated"),
            value: user.accountCreated,
            color: "text-card-orange",
            bg: "bg-card-orange-light",
        },
    ];

    return (
        <div className="space-y-4">
            {/* Profile Header Card */}
            <div className="bg-surface rounded-xl border border-surface-border p-5 sm:p-6">
                <div className={`flex items-center gap-4 sm:gap-5 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-card-blue-light flex items-center justify-center shrink-0">
                        <span className="text-2xl sm:text-3xl font-bold text-card-blue">
                            {displayInitial}
                        </span>
                    </div>
                    <div className={`min-w-0 flex-1 ${dir === "rtl" ? "text-right" : ""}`}>
                        <h2 className="text-lg sm:text-xl font-bold text-text-primary truncate">
                            {displayName}
                        </h2>
                        <p className="text-sm text-text-secondary mt-0.5 truncate">{user.email}</p>
                        <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-card-green-light text-card-green">
                            {subscriptionLabel}
                        </span>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map((field, idx) => (
                    <div
                        key={idx}
                        className={`bg-surface rounded-xl border border-surface-border p-4 sm:p-5 flex items-center gap-3 sm:gap-4 ${dir === "rtl" ? "flex-row-reverse" : ""}`}
                    >
                        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl shrink-0 flex items-center justify-center ${field.bg} ${field.color}`}>
                            {field.icon}
                        </div>
                        <div className={`min-w-0 flex-1 ${dir === "rtl" ? "text-right" : ""}`}>
                            <p className="text-xs text-text-muted">{field.label}</p>
                            <p className="text-sm font-semibold text-text-primary truncate mt-0.5">
                                {field.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Read-only notice */}
            <div className={`flex items-start gap-3 bg-card-orange-light border border-card-orange/20 rounded-xl px-4 py-3 text-sm text-card-orange font-medium ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                <Info size={16} className="shrink-0 mt-0.5" />
                <span>{t("custProfileReadonly")}</span>
            </div>
        </div>
    );
}
