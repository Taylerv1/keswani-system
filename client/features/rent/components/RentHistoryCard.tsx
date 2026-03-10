"use client";

import { useTranslation } from "@/lib/translation";
import { StatusBadge } from "@/components/ui";
import type { RentPayment } from "@/features/profile/context/customer-context";

interface RentHistoryCardProps {
    payment: RentPayment;
}

export default function RentHistoryCard({ payment }: RentHistoryCardProps) {
    const { t, locale } = useTranslation();

    const formatMonth = (monthStr: string | null | undefined) => {
        if (!monthStr) return "-";
        const date = new Date(monthStr + "T12:00:00");
        if (isNaN(date.getTime())) return monthStr;
        return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
            month: "long",
            year: "numeric",
        });
    };

    return (
        <div className="bg-surface rounded-xl border border-surface-border p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">
                        {formatMonth(payment.month)}
                    </span>
                </div>
                <StatusBadge status={payment.status} />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">{t("amount")}</span>
                    <span className="text-sm font-bold text-text-primary">
                        ${payment.amount.toFixed(2)}
                    </span>
                </div>

                {payment.date && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">{t("paymentDate")}</span>
                        <span className="text-sm text-text-secondary">{payment.date}</span>
                    </div>
                )}

                {payment.receiptNumber && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">
                            {t("receiptNumber")}
                        </span>
                        <span className="text-xs text-text-muted font-mono">
                            {payment.receiptNumber}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
