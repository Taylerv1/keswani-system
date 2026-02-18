"use client";

import { useTranslation } from "@/lib/translation-context";
import { StatusBadge } from "@/components/ui";
import type { ElectricityBill } from "@/modules/customer/customer-context";

interface ElectricityBillCardProps {
    bill: ElectricityBill;
}

export default function ElectricityBillCard({ bill }: ElectricityBillCardProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-surface rounded-xl border border-surface-border p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-text-primary">
                    {bill.month}
                </span>
                <StatusBadge status={bill.status} />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">{t("consumption")}</span>
                    <span className="text-sm font-medium text-text-secondary">
                        {bill.consumption} {t("kwh")}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">{t("pricePerKwh")}</span>
                    <span className="text-sm text-text-secondary">
                        ${bill.pricePerKwh}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">{t("baseAmount")}</span>
                    <span className="text-sm text-text-secondary">
                        ${bill.baseAmount.toFixed(2)}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">{t("additionalFees")}</span>
                    <span className="text-sm text-text-secondary">
                        ${bill.additionalFees.toFixed(2)}
                    </span>
                </div>

                <div className="border-t border-surface-border pt-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary">
                        {t("total")}
                    </span>
                    <span className="text-sm font-bold text-text-primary">
                        ${bill.totalAmount.toFixed(2)}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">{t("dueDate")}</span>
                    <span className="text-xs text-text-muted">{bill.dueDate}</span>
                </div>
            </div>
        </div>
    );
}
