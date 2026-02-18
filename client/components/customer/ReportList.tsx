"use client";

import { useTranslation } from "@/lib/translation-context";
import { StatusBadge } from "@/components/ui";
import type { CustomerReport } from "@/modules/customer/customer-context";
import { FileText, Zap, Home } from "lucide-react";

interface ReportListProps {
    reports: CustomerReport[];
}

export default function ReportList({ reports }: ReportListProps) {
    const { t, locale } = useTranslation();

    if (reports.length === 0) {
        return (
            <div className="bg-surface rounded-xl border border-surface-border p-8 text-center">
                <FileText size={40} className="mx-auto text-text-muted mb-3" />
                <p className="text-text-secondary text-sm">{t("custNoReports")}</p>
            </div>
        );
    }

    return (
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-border">
                <h3 className="text-sm font-semibold text-text-primary">
                    {t("custPreviousReports")}
                </h3>
            </div>
            <div className="divide-y divide-surface-border">
                {reports.map((report) => {
                    const title = locale === "ar" ? report.titleAr : report.title;
                    const desc =
                        locale === "ar" ? report.descriptionAr : report.description;
                    const note =
                        locale === "ar"
                            ? report.noteAr
                            : report.note;

                    return (
                        <div
                            key={report.id}
                            className="px-5 py-4 hover:bg-background/50 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="shrink-0">
                                        {report.type === "rent" ? (
                                            <Home size={16} className="text-card-green" />
                                        ) : (
                                            <Zap size={16} className="text-card-orange" />
                                        )}
                                    </span>
                                    <span className="text-sm font-semibold text-text-primary truncate">
                                        {title}
                                    </span>
                                </div>
                                <StatusBadge
                                    status={report.status === "in_review" ? "inProgress" : report.status}
                                />
                            </div>

                            <p className="text-xs text-text-secondary mb-2 line-clamp-2">
                                {desc}
                            </p>

                            {note && (
                                <p className="text-xs text-text-muted italic mb-1">
                                    {t("notes")}: {note}
                                </p>
                            )}

                            <div className="flex items-center justify-between">
                                <span className="text-xs text-text-muted">
                                    {t("custReportType")}:{" "}
                                    {report.type === "rent"
                                        ? t("custRentIssue")
                                        : t("custElecIssue")}
                                </span>
                                <span className="text-xs text-text-muted">
                                    {report.createdAt}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
