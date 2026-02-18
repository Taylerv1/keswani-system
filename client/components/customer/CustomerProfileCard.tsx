"use client";

import { useTranslation } from "@/lib/translation-context";
import type { CustomerUser } from "@/modules/customer/customer-context";
import { User, Phone, MapPin, Globe, Calendar, Shield } from "lucide-react";

interface CustomerProfileCardProps {
    user: CustomerUser;
}

export default function CustomerProfileCard({ user }: CustomerProfileCardProps) {
    const { t, locale } = useTranslation();

    const displayName = locale === "ar" ? user.nameAr : user.name;
    const displayAddress = locale === "ar" ? user.addressAr : user.address;

    const fields = [
        {
            icon: <User size={16} />,
            label: t("name"),
            value: displayName,
        },
        {
            icon: <Phone size={16} />,
            label: t("phone"),
            value: user.phone,
        },
        {
            icon: <MapPin size={16} />,
            label: t("address"),
            value: displayAddress,
        },
        {
            icon: <Shield size={16} />,
            label: t("custSubscriptionType"),
            value: t(
                user.subscriptionType === "rent_electricity"
                    ? "custSubBoth"
                    : user.subscriptionType === "rent"
                        ? "custSubRent"
                        : "custSubElec"
            ),
        },
        {
            icon: <Globe size={16} />,
            label: t("languagePreference"),
            value: user.languagePreference === "en" ? "English" : "العربية",
        },
        {
            icon: <Calendar size={16} />,
            label: t("accountCreated"),
            value: user.accountCreated,
        },
    ];

    return (
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
            {/* Header */}
            <div className="relative h-28 bg-gradient-to-r from-primary to-primary-hover">
                <div className="absolute -bottom-10 start-6">
                    <div className="w-20 h-20 rounded-2xl bg-surface border-4 border-surface flex items-center justify-center shadow-lg">
                        <span className="text-3xl font-bold text-primary">
                            {displayName.charAt(0)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="pt-14 pb-6 px-6">
                <h2 className="text-xl font-bold text-text-primary mb-1">
                    {displayName}
                </h2>
                <p className="text-sm text-text-secondary mb-6">{user.email}</p>

                <div className="space-y-4">
                    {fields.map((field, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                {field.icon}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-text-muted">{field.label}</p>
                                <p className="text-sm font-medium text-text-primary truncate">
                                    {field.value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Read-only notice */}
                <div className="mt-6 px-4 py-3 rounded-lg bg-card-blue-light text-card-blue text-xs font-medium">
                    {t("custProfileReadonly")}
                </div>
            </div>
        </div>
    );
}
