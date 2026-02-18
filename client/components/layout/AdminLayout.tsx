"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, Search, Bell } from "lucide-react";
import PrimarySidebar from "@/components/layout/PrimarySidebar";
import SecondarySidebar from "@/components/layout/SecondarySidebar";
import { useTranslation } from "@/lib/translation-context";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { t, dir, toggleLocale } = useTranslation();

  const sidebarWidth = sidebarCollapsed ? 68 : 240;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Primary Sidebar */}
      <PrimarySidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main content area */}
      <div
        className="transition-all duration-300 min-h-screen"
        style={{
          [dir === "rtl" ? "marginRight" : "marginLeft"]: `${sidebarWidth}px`,
        }}
      >
        {/* Top Bar */}
        <header className="h-16 bg-surface border-b border-surface-border flex items-center justify-between px-6 sticky top-0 z-30">
          {/* Left: breadcrumb placeholder */}
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span>{t("dashboard")}</span>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search
                size={16}
                className="absolute top-1/2 -translate-y-1/2 text-text-muted"
                style={{ [dir === "rtl" ? "right" : "left"]: "12px" }}
              />
              <input
                type="text"
                placeholder={t("search")}
                className="h-9 rounded-lg border border-surface-border bg-background text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                style={{
                  width: "200px",
                  [dir === "rtl" ? "paddingRight" : "paddingLeft"]: "36px",
                  [dir === "rtl" ? "paddingLeft" : "paddingRight"]: "12px",
                }}
              />
            </div>

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

            {/* Notifications placeholder */}
            <button className="relative w-9 h-9 rounded-lg border border-surface-border bg-background flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/40 transition-all cursor-pointer">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-card-red text-white text-[10px] flex items-center justify-center font-bold">
                3
              </span>
            </button>

            {/* Avatar */}
            <Link href="/admin-dashboard/profile">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-semibold text-sm cursor-pointer">
                A
              </div>
            </Link>
          </div>
        </header>

        {/* Body */}
        <div className="flex h-[calc(100vh-64px)]">
          {/* Secondary sidebar – self-determines visibility by pathname */}
          <SecondarySidebar />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
