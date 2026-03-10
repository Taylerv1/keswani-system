"use client";

import { useTranslation } from "@/lib/translation";
import { useCustomer } from "@/features/profile/context/customer-context";
import CustomerProfileCard from "@/features/profile/components/CustomerProfileCard";

export default function CustomerProfilePage() {
    const { t } = useTranslation();
    const { data } = useCustomer();

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-primary">
                    {t("custProfile")}
                </h1>
                <p className="text-text-secondary text-sm mt-1">
                    {t("custProfileSubtitle")}
                </p>
            </div>

            <CustomerProfileCard user={data.user} />
        </div>
    );
}
