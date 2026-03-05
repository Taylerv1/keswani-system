"use client";

import { useEffect, useState } from "react";
import { Home, Zap, FileText, User } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { useCustomer } from "@/features/profile/context/customer-context";
import { KpiCard, LoadingLottie } from "@/components/ui";
import Link from "next/link";

export default function CustomerDashboardPage() {
    const { t, locale } = useTranslation();
    const { data, hasRentData, hasElectricityData, loading, error } = useCustomer();
    const [pendingMaintenance, setPendingMaintenance] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch by rendering only on client after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    const displayName = locale === "ar" ? data.user.nameAr : data.user.name;

    const unpaidRent =
        data.rent?.payments.filter((p) => p.status === "pending" || p.status === "overdue").length ?? 0;
    const unpaidBills =
        data.electricity?.bills.filter((b) => b.status === "unpaid").length ?? 0;

    useEffect(() => {
        let cancelled = false;

        const loadPendingMaintenance = async () => {
            if (!hasRentData) {
                setPendingMaintenance(null);
                return;
            }

            try {
                const response = await fetch("/api/maintenance?status=pending&page=1&limit=1", {
                    method: "GET",
                    cache: "no-store",
                });
                const payload = await response.json();

                if (cancelled) return;

                if (response.ok && payload?.success) {
                    const total = Number(payload?.data?.pagination?.total ?? 0);
                    setPendingMaintenance(Number.isFinite(total) ? total : 0);
                    return;
                }
            } catch {
                // Fallback to mock-derived count below
            }

            if (!cancelled) {
                setPendingMaintenance(null);
            }
        };

        void loadPendingMaintenance();

        return () => {
            cancelled = true;
        };
    }, [hasRentData]);

    const pendingReports =
        pendingMaintenance ?? data.reports.filter((r) => r.status === "pending").length;

    const quickLinks = [
        ...(hasRentData
            ? [
                {
                    key: "custRentHistory",
                    href: "/dashboard/rent-history",
                    icon: <Home size={20} />,
                    color: "text-card-green",
                    bgColor: "bg-card-green-light",
                },
            ]
            : []),
        ...(hasElectricityData
            ? [
                {
                    key: "custElecHistory",
                    href: "/dashboard/electricity-history",
                    icon: <Zap size={20} />,
                    color: "text-card-orange",
                    bgColor: "bg-card-orange-light",
                },
            ]
            : []),
        {
            key: "custReports",
            href: "/dashboard/reports",
            icon: <FileText size={20} />,
            color: "text-card-blue",
            bgColor: "bg-card-blue-light",
        },
        {
            key: "custProfile",
            href: "/dashboard/profile",
            icon: <User size={20} />,
            color: "text-card-red",
            bgColor: "bg-card-red-light",
        },
    ];

    if (!mounted) return null;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="bg-surface rounded-xl p-12 flex justify-center" role="status" aria-live="polite">
                    <LoadingLottie size={150} className="p-6" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white">
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-medium">{error}</p>
                </div>
            )}

            <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-primary">
                    {t("custWelcome")}, {displayName}
                </h1>
                <p className="text-text-secondary text-sm mt-1">
                    {t("custOverviewSubtitle")}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5 mb-8">
                {hasRentData && (
                    <>
                        <KpiCard
                            label={t("monthlyRent")}
                            value={`$${data.rent!.contract.monthlyRent.toLocaleString()}`}
                            icon={<Home size={22} />}
                            color="text-card-green"
                            bgColor="bg-card-green-light"
                            trend={`${t("custContractStatus")}: ${t(data.rent!.contract.status)}`}
                        />
                        <KpiCard
                            label={t("custUpcomingPayments")}
                            value={unpaidRent}
                            icon={<Home size={22} />}
                            color="text-card-orange"
                            bgColor="bg-card-orange-light"
                        />
                    </>
                )}
                {hasElectricityData && (
                    <>
                        <KpiCard
                            label={t("custOutstandingBills")}
                            value={unpaidBills}
                            icon={<Zap size={22} />}
                            color={unpaidBills > 0 ? "text-card-red" : "text-card-green"}
                            bgColor={unpaidBills > 0 ? "bg-card-red-light" : "bg-card-green-light"}
                        />
                        <KpiCard
                            label={t("currentPriceKwh")}
                            value={`$${data.electricity!.currentPricePerKwh}`}
                            icon={<Zap size={22} />}
                            color="text-card-blue"
                            bgColor="bg-card-blue-light"
                            trend={t("perKwh")}
                        />
                    </>
                )}
                <KpiCard
                    label={t("custPendingReports")}
                    value={pendingReports}
                    icon={<FileText size={22} />}
                    color="text-card-blue"
                    bgColor="bg-card-blue-light"
                />
            </div>

            {/* Quick Links */}
            <h2 className="text-lg font-semibold text-text-primary mb-4">
                {t("custQuickLinks")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {quickLinks.map((link) => (
                    <Link
                        key={link.key}
                        href={link.href}
                        className="bg-surface rounded-xl border border-surface-border p-3 sm:p-5 flex items-center gap-3 sm:gap-4 hover:shadow-lg hover:border-primary/30 transition-all duration-200 no-underline group"
                    >
                        <div
                            className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${link.bgColor} ${link.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200`}
                        >
                            {link.icon}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                            {t(link.key)}
                        </span>
                    </Link>
                ))}
            </div>
            </div>
        </div>
    );
}
