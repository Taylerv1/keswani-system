"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Globe, Bell, Menu, LayoutList } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { autorun, reaction } from "mobx";
import PrimarySidebar from "@/components/layout/PrimarySidebar";
import SecondarySidebar from "@/components/layout/SecondarySidebar";
import { useTranslation } from "@/lib/translation";
import { getUserData } from "@/lib/helpers/auth-client";
import { notificationsStore } from "@/features/notifications/store";
import { typeTranslationMap, parseNotificationMessage } from "@/features/notifications/utils";
import type { NotificationItem } from "@/features/notifications/types";

function timeAgo(dateStr: string, locale: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return dateStr;

  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return locale === "ar" ? "الآن" : "Just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return locale === "ar" ? `منذ ${diffMin} د` : `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return locale === "ar" ? `منذ ${diffHr} س` : `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return locale === "ar" ? "أمس" : "Yesterday";
  if (diffDay < 7) return locale === "ar" ? `منذ ${diffDay} أيام` : `${diffDay}d ago`;

  return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-LB" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobilePrimaryOpen, setMobilePrimaryOpen] = useState(false);
  const [mobileSecondaryOpen, setMobileSecondaryOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [userEmail, setUserEmail] = useState("No email available");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentItems, setRecentItems] = useState<NotificationItem[]>([]);
  const notificationRootRef = useRef<HTMLDivElement>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();
  const { t, dir, locale, toggleLocale } = useTranslation();
  const pathname = usePathname();
  const safePathname = pathname ?? "";

  const hasSecondaryNav =
    safePathname.startsWith("/admin-dashboard/rent") ||
    safePathname.startsWith("/admin-dashboard/electricity");

  // Polling lifecycle
  useEffect(() => {
    notificationsStore.startPolling(10_000);
    return () => notificationsStore.stopPolling();
  }, []);

  // Preload notification sound
  useEffect(() => {
    const audio = new Audio("/notificationSound.wav");
    audio.preload = "auto";
    notificationAudioRef.current = audio;
  }, []);

  // Play sound on every new notification batch
  useEffect(() => {
    const dispose = reaction(
      () => notificationsStore.newNotificationsBurst,
      () => {
        const audio = notificationAudioRef.current;
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
      }
    );
    return () => dispose();
  }, []);

  // MobX reactivity — bridge to React state
  useEffect(() => {
    const dispose = autorun(() => {
      setUnreadCount(notificationsStore.unreadCount);
      setRecentItems(notificationsStore.recentItems.slice());
    });
    return () => dispose();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initialUser = getUserData();
    if (isMounted && initialUser?.email) {
      setUserEmail(initialUser.email);
    }

    const loadMe = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          const user = getUserData();
          if (isMounted && user?.email) {
            setDisplayName("Admin");
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
          setDisplayName("Admin");
          setUserEmail(user.email);
        }
      } catch {
        const user = getUserData();
        if (isMounted && user?.email) {
          setDisplayName("Admin");
          setUserEmail(user.email);
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

      const user = getUserData();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };

    window.addEventListener("profile:name-updated", handleProfileNameUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("profile:name-updated", handleProfileNameUpdated);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!notificationRootRef.current) {
        return;
      }

      const target = event.target as Node;
      if (!notificationRootRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const avatarInitial = useMemo(() => {
    const firstChar = displayName.trim().charAt(0);
    return firstChar ? firstChar.toUpperCase() : "A";
  }, [displayName]);

  const latestNotifications = recentItems.slice(0, 3);

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.read) {
      void notificationsStore.markRead(notification.id, { errorFallback: t("error") });
    }
    setNotificationsOpen(false);
    router.push("/admin-dashboard/notifications");
  };

  const handleSeeMoreNotifications = () => {
    setNotificationsOpen(false);
    router.push("/admin-dashboard/notifications");
  };

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

            <div ref={notificationRootRef} className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative w-9 h-9 rounded-lg border border-surface-border bg-background flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
                aria-label={t("notifications")}
                aria-expanded={notificationsOpen}
                aria-haspopup="menu"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-card-red text-white text-[10px] flex items-center justify-center font-bold leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className={`absolute top-[calc(100%+10px)] z-[80] w-[min(350px,88vw)] rounded-xl border border-surface-border bg-surface shadow-lg overflow-hidden animate-fade-in-up ${dir === "rtl" ? "left-0" : "right-0"}`}
                  role="menu"
                  aria-label={`${t("notifications")} menu`}
                >
                  <div className="px-4 py-3 text-sm font-bold text-text-primary border-b border-surface-border">
                    {t("notifications")}
                  </div>

                  {latestNotifications.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-text-secondary">
                      {t("noResults")}
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      {latestNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          className={`w-full px-4 py-3 ${dir === "rtl" ? "text-right" : "text-left"} hover:bg-background transition-colors cursor-pointer`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-2">
                            <p
                              className={`m-0 text-[13px] ${!notification.read ? "font-semibold" : "font-normal"} text-text-primary flex-1 leading-5`}
                            >
                              {t(typeTranslationMap[notification.type] ?? "notifications")}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          {notification.message && (
                            <p className="m-0 mt-0.5 text-[12px] text-text-secondary leading-4 line-clamp-2">
                              {parseNotificationMessage(notification.message, locale)}
                            </p>
                          )}
                          <p className="m-0 mt-1 text-[11px] text-text-muted">
                            {timeAgo(notification.createdAt, locale)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSeeMoreNotifications}
                    className="w-full border-0 border-t border-surface-border bg-surface hover:bg-background text-primary text-xs font-semibold px-4 py-3 cursor-pointer"
                  >
                    {t("seeMore")}
                  </button>
                </div>
              )}
            </div>

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
                  <p className="text-[11px] uppercase tracking-wide text-primary font-semibold">{t("email")}</p>
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
