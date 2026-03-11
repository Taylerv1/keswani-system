"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, Menu } from "lucide-react";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import { useTranslation } from "@/lib/translation";
import { useCustomer } from "@/features/profile/context/customer-context";

interface CustomerLayoutProps {
    children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const { t, dir, toggleLocale, locale } = useTranslation();
    const { data } = useCustomer();

    // Defensive: data.user may be undefined during initial load or when not authenticated.
    const displayName = locale === "ar" ? data?.user?.nameAr ?? "" : data?.user?.name ?? "";
    const avatarInitial = displayName?.charAt(0) ?? "?";

    return (
        <div className={`min-h-screen bg-background ${dir === "rtl" ? "scrollbar-left" : "scrollbar-right"}`} dir={dir}>
            {/* Mobile backdrop */}
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 md:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}

            {/* Customer Sidebar */}
            <CustomerSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed((prev) => !prev)}
                mobileOpen={mobileSidebarOpen}
                onMobileClose={() => setMobileSidebarOpen(false)}
            />

            {/* Main content area */}
            <div
                className={`transition-all duration-300 min-h-screen ${sidebarCollapsed ? "md:ms-[68px]" : "md:ms-[240px]"}`}
            >
                {/* Top Bar */}
                <header className="h-16 bg-surface border-b border-surface-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
                    {/* Left: hamburger (mobile) + greeting */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileSidebarOpen(true)}
                            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-surface-border bg-background text-text-secondary hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
                            aria-label="Open menu"
                        >
                            <Menu size={18} />
                        </button>
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <span className="hidden sm:inline">{t("custWelcome")},</span>
                            <span className="font-semibold text-text-primary">
                                {displayName}
                            </span>
                        </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-3">
                        {/* Language toggle */}
                        <button
                            onClick={toggleLocale}
                            className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-surface-border
                bg-background text-text-secondary hover:text-primary hover:border-primary/40
                transition-all duration-200 text-sm cursor-pointer"
                        >
                            <Globe size={16} />
                            <span className="hidden sm:inline">{t("switchLanguage")}</span>
                        </button>

                        {/* Avatar */}
                        <Link href="/dashboard/profile">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-semibold text-sm cursor-pointer">
                                {avatarInitial}
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Body: make fixed-height flex so sidebar and main scroll independently */}
                <div className="flex h-[calc(100vh-64px)]">
                    {/* Spacer for left/right when sidebar is fixed */}
                    <main className={`scrollbar-primary flex-1 overflow-y-auto p-6 ${dir === "rtl" ? "scrollbar-left" : "scrollbar-right"}`}>
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
