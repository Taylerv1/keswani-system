"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Globe, Search, Bell, Menu, LayoutList } from "lucide-react";
import { usePathname } from "next/navigation";
import PrimarySidebar from "@/components/layout/PrimarySidebar";
import SecondarySidebar from "@/components/layout/SecondarySidebar";
import { useTranslation } from "@/lib/translation-context";
import { getUserData } from "@/lib/auth-client";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobilePrimaryOpen, setMobilePrimaryOpen] = useState(false);
  const [mobileSecondaryOpen, setMobileSecondaryOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const { t, dir, locale, toggleLocale } = useTranslation();
  const pathname = usePathname();

  const hasSecondaryNav =
    pathname.startsWith("/admin-dashboard/rent") ||
    pathname.startsWith("/admin-dashboard/electricity");

  useEffect(() => {
    let isMounted = true;

    const loadMe = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          const user = getUserData();
          if (isMounted && user?.email) {
            setDisplayName(user.email);
          }
          return;
        }

        const result = await res.json();
        const fullName = result?.data?.profile?.full_name;

        if (isMounted && typeof fullName === "string" && fullName.trim()) {
          setDisplayName(fullName.trim());
          return;
        }

        const user = getUserData();
        if (isMounted && user?.email) {
          setDisplayName(user.email);
        }
      } catch {
        const user = getUserData();
        if (isMounted && user?.email) {
          setDisplayName(user.email);
        }
      }
    };

    loadMe();

    const handleProfileNameUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ fullName?: string }>;
      const fullName = customEvent.detail?.fullName;

      if (typeof fullName === "string" && fullName.trim()) {
        setDisplayName(fullName.trim());
      }
    };

    window.addEventListener("profile:name-updated", handleProfileNameUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("profile:name-updated", handleProfileNameUpdated);
    };
  }, []);

  const avatarInitial = useMemo(() => {
    const firstChar = displayName.trim().charAt(0);
    return firstChar ? firstChar.toUpperCase() : "A";
  }, [displayName]);
  const userEmail = getUserData()?.email || "No email available";

  const welcomeBackText = locale === "ar" ? "أهلًا بعودتك" : "Welcome back";

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Mobile backdrop for primary sidebar */}
      {mobilePrimaryOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobilePrimaryOpen(false)}
        />
      )}

      {/* Primary Sidebar */}
      <PrimarySidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobilePrimaryOpen}
        onMobileClose={() => setMobilePrimaryOpen(false)}
      />

      {/* Main content area */}
      <div
        className={`transition-all duration-300 min-h-screen ${sidebarCollapsed ? "md:ms-[68px]" : "md:ms-[240px]"}`}
      >
        {/* Top Bar */}
        <header className="h-16 bg-surface border-b border-surface-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          {/* Left: hamburger (mobile) + sections button (mobile) + breadcrumb */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobilePrimaryOpen(true)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-surface-border bg-background text-text-secondary hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            {hasSecondaryNav && (
              <button
                onClick={() => setMobileSecondaryOpen(true)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-surface-border bg-background text-text-secondary hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
                aria-label="Open sections"
              >
                <LayoutList size={18} />
              </button>
            )}
            {/* Breadcrumb placeholder */}
            <div className="flex items-center gap-1.5 text-sm text-text-secondary">
              <span className="text-text-muted">{welcomeBackText},</span>
              <span>{displayName}</span>
            </div>
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
            <div className="relative group">
              <Link href="/admin-dashboard/profile">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-semibold text-sm cursor-pointer transition-transform duration-200 group-hover:scale-105">
                  {avatarInitial}
                </div>
              </Link>

              <div
                className={`
                  absolute top-[calc(100%+10px)] ${dir === "rtl" ? "left-0" : "right-0"}
                  z-50 w-[240px] rounded-xl border border-white/10
                  bg-gradient-to-b from-sidebar-bg to-sidebar-bg-dark text-sidebar-text shadow-xl backdrop-blur-md
                  opacity-0 pointer-events-none translate-y-1 scale-95
                  transition-all duration-200
                  group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100
                `}
              >
                <div
                  className={`absolute -top-1.5 w-3 h-3 rotate-45 bg-sidebar-bg-dark border border-white/10 ${dir === "rtl" ? "left-3" : "right-3"}`}
                />

                <div className="px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-primary font-semibold">Email</p>
                  <p className="mt-1 text-sm font-medium text-white truncate" title={userEmail}>
                    {userEmail}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex h-[calc(100vh-64px)]">
          {/* Secondary sidebar – self-determines visibility by pathname */}
          <SecondarySidebar
            mobileOpen={mobileSecondaryOpen}
            onClose={() => setMobileSecondaryOpen(false)}
          />

          {/* Page content */}
          <main className="scrollbar-primary flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
