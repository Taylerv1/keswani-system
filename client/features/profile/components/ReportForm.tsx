"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { useCustomer } from "@/features/profile/context/customer-context";
import type { CustomerReport } from "@/features/profile/context/customer-context";
import { LoadingLottie } from "@/components/ui";

export default function ReportForm() {
    const { t, locale } = useTranslation();
    const { addReport } = useCustomer();

    const [reportType, setReportType] = useState<"rent" | "electricity">("rent");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [note, setNote] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;

        setLoading(true);

        setTimeout(() => {
            const newReport: Omit<CustomerReport, "id" | "createdAt"> = {
                type: reportType,
                title,
                titleAr: title,
                description,
                descriptionAr: description,
                note: note.trim() || null,
                noteAr: note.trim() || null,
                status: "pending",
            };

            addReport(newReport);
            setTitle("");
            setDescription("");
            setNote("");
            setLoading(false);
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 3000);
        }, 600);
    };

    return (
        <div className="bg-surface rounded-xl border border-surface-border p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
                {t("custCreateReport")}
            </h3>

            {submitted && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-card-green-light text-card-green text-sm font-medium">
                    {t("custReportSubmitted")}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Report type */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        {t("custReportType")}
                    </label>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setReportType("rent")}
                            className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-all cursor-pointer ${reportType === "rent"
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "border-surface-border text-text-secondary hover:border-primary/40"
                                }`}
                        >
                            {t("custRentIssue")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setReportType("electricity")}
                            className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-all cursor-pointer ${reportType === "electricity"
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "border-surface-border text-text-secondary hover:border-primary/40"
                                }`}
                        >
                            {t("custElecIssue")}
                        </button>
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        {t("custReportTitle")}
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t("custReportTitlePlaceholder")}
                        required
                        className="w-full h-10 px-3 rounded-lg border border-surface-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        {t("description")}
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t("custReportDescPlaceholder")}
                        required
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-surface-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm resize-none"
                    />
                </div>

                {/* Note */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        {t("custOptionalNote")}
                    </label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t("custNotePlaceholder")}
                        className="w-full h-10 px-3 rounded-lg border border-surface-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading || !title.trim() || !description.trim()}
                    className="w-full h-11 rounded-lg font-semibold text-sm text-white
            bg-gradient-to-r from-primary to-primary-hover
            hover:shadow-lg hover:shadow-primary/30
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-all duration-200 cursor-pointer border-0
            flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <LoadingLottie size={28} />
                    ) : (
                        <>
                            <Send size={16} />
                            {t("custSubmitReport")}
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
