"use client";

import { useTranslation } from "@/lib/translation-context";
import { useCustomer } from "@/modules/customer/customer-context";
import CustomerProfileCard from "@/components/customer/CustomerProfileCard";

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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-6 sm:py-10">
                    <CustomerProfileCard user={data.user} />
                </div>
            </div>
        </div>
    );
}
