"use client";

import { useTranslation } from "@/lib/translation-context";
import { StatusBadge } from "@/components/ui";
import type { RentPayment } from "@/modules/customer/customer-context";

interface RentHistoryCardProps {
    payment: RentPayment;
}

export default function RentHistoryCard({ payment }: RentHistoryCardProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-surface rounded-xl border border-surface-border p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">
                        {payment.month}
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

                {payment.method && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">
                            {t("paymentMethod")}
                        </span>
                        <span className="text-sm text-text-secondary">
                            {t(payment.method === "bank_transfer" ? "bankTransfer" : payment.method)}
                        </span>
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
