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
        <div className="w-full bg-surface rounded-2xl border border-surface-border overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="relative h-44 sm:h-56 bg-gradient-to-r from-primary to-primary-hover">
                <div className="absolute -bottom-16 sm:-bottom-20 left-6 sm:left-12">
                    <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-white border-4 sm:border-8 flex items-center justify-center shadow-2xl">
                        <span className="text-4xl sm:text-6xl font-extrabold text-primary">
                            {displayName.charAt(0)}
                        </span>
                    </div>
                </div>
                <div className="absolute right-4 sm:right-6 top-4 sm:top-6">
                    <button className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 text-white text-sm rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/30">
                        {t("edit")}
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="pt-20 sm:pt-28 pb-8 sm:pb-12 px-6 sm:px-12">
                <div className="flex items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl sm:text-4xl font-bold text-text-primary">
                            {displayName}
                        </h2>
                        <p className="text-sm sm:text-lg text-text-secondary mt-2">{user.email}</p>
                    </div>
                </div>

                <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    {fields.map((field, idx) => (
                        <div key={idx} className="flex items-start gap-4 sm:gap-6">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0 shadow-sm">
                                {field.icon}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm text-text-muted">{field.label}</p>
                                <p className="text-base sm:text-lg font-medium text-text-primary truncate">
                                    {field.value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Read-only notice */}
                <div className="mt-6 sm:mt-10 px-4 sm:px-8 py-3 sm:py-4 rounded-lg bg-yellow-50 border border-yellow-200 text-sm sm:text-base text-yellow-800 font-medium">
                    {t("custProfileReadonly")}
                </div>
            </div>
        </div>
    );
}
