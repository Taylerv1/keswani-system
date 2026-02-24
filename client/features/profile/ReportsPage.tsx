"use client";

import { useTranslation } from "@/lib/translation";
import { useCustomer } from "@/features/profile/context/customer-context";
import ReportForm from "@/features/profile/components/ReportForm";
import ReportList from "@/features/profile/components/ReportList";

export default function ReportsPage() {
    const { t } = useTranslation();
    const { data } = useCustomer();

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-primary">
                    {t("custReports")}
                </h1>
                <p className="text-text-secondary text-sm mt-1">
                    {t("custReportsSubtitle")}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Report Form (WRITE allowed) */}
                <ReportForm />

                {/* Previous Reports List */}
                <ReportList reports={data.reports} />
            </div>
        </div>
    );
}
