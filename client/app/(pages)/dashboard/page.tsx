"use client";

import { Home, Zap, FileText, User } from "lucide-react";
import { useTranslation } from "@/lib/translation-context";
import { useCustomer } from "@/modules/customer/customer-context";
import { KpiCard } from "@/components/ui";
import Link from "next/link";

export default function CustomerDashboardPage() {
    const { t, locale } = useTranslation();
    const { data, hasRentData, hasElectricityData } = useCustomer();

    const displayName = locale === "ar" ? data.user.nameAr : data.user.name;

    const unpaidRent =
        data.rent?.payments.filter((p) => p.status === "pending" || p.status === "overdue").length ?? 0;
    const unpaidBills =
        data.electricity?.bills.filter((b) => b.status === "unpaid").length ?? 0;
    const pendingReports = data.reports.filter((r) => r.status === "pending").length;

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

    return (
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
    );
}
