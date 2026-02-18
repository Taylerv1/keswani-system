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

            <div className="max-w-lg">
                <CustomerProfileCard user={data.user} />
            </div>
        </div>
    );
}
