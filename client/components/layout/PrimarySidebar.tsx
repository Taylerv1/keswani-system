"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Home,
  Zap,
  User,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { logout } from "@/lib/helpers/auth-client";
import { fetchNotificationStats } from "@/features/rent/api/notifications";

interface NavItem {
  key: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { key: "rent", href: "/admin-dashboard/rent", icon: <Home size={20} /> },
  { key: "electricity", href: "/admin-dashboard/electricity", icon: <Zap size={20} /> },
  { key: "notifications", href: "/admin-dashboard/notifications", icon: <Bell size={20} /> },
  { key: "employees", href: "/admin-dashboard/employees", icon: <Users size={20} /> },
  { key: "profile", href: "/admin-dashboard/profile", icon: <User size={20} /> },
];

interface PrimarySidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function PrimarySidebar({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: PrimarySidebarProps) {
  const pathname = usePathname();
  const safePathname = pathname ?? "";
  const router = useRouter();
  const { t, dir } = useTranslation();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotificationStats()
      .then((res) => {
        if (res.success && res.data) {
          setUnreadCount(res.data.total_unread);
        }
      })
      .catch(() => setUnreadCount(0));
  }, []);

  const handleLogout = () => {
    router.replace("/login");
    logout();
  };

  const CollapseIcon =
    dir === "rtl"
      ? collapsed
        ? ChevronLeft
        : ChevronRight
      : collapsed
        ? ChevronRight
        : ChevronLeft;

  return (
    <aside
      className={`
        fixed top-0 h-screen z-40 flex flex-col
        bg-gradient-to-b from-sidebar-bg to-sidebar-bg-dark
        text-sidebar-text transition-all duration-300 ease-in-out
        w-[240px] ${collapsed ? "md:w-[68px]" : "md:w-[240px]"}
        ${dir === "rtl" ? "right-0" : "left-0"}
        ${mobileOpen
          ? "translate-x-0"
          : dir === "rtl"
            ? "translate-x-full md:translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }
      `}
    >
      {/* Logo / Brand */}
      <div className="flex items-center justify-center px-3 py-2 border-b border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logoV2.png"
          alt="Keswani Logo"
          className={`w-full h-auto object-contain ${collapsed ? "md:hidden" : ""}`}
        />
        {collapsed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/CloseSidebarLogo.png"
            alt="Keswani Logo"
            className="hidden md:block w-10 h-10 object-contain"
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="scrollbar-primary flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = safePathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-200 no-underline
                ${isActive
                  ? "bg-primary text-sidebar-text-active shadow-lg"
                  : "text-sidebar-text hover:bg-white/8 hover:text-sidebar-text-active"
                }
                ${collapsed ? "md:justify-center" : ""}
              `}
              title={collapsed ? t(item.key) : undefined}
              onClick={onMobileClose}
            >
              <span className="shrink-0 relative">
                {item.icon}
                {item.key === "notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-card-red text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span className={`text-sm font-medium ${collapsed ? "md:hidden" : ""}`}>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="py-4 px-2 border-t border-white/10 space-y-1">
        <button
          onClick={handleLogout}
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-lg w-full cursor-pointer
            text-sidebar-text hover:bg-card-red/20 hover:text-card-red
            transition-all duration-200
            ${collapsed ? "md:justify-center" : ""}
          `}
          title={collapsed ? t("logout") : undefined}
        >
          <LogOut size={20} className="shrink-0" />
          <span className={`text-sm font-medium ${collapsed ? "md:hidden" : ""}`}>{t("logout")}</span>
        </button>
      </div>

      {/* Collapse toggle – desktop only */}
      <button
        onClick={onToggle}
        className={`
          hidden md:flex
          absolute top-1/2 -translate-y-1/2
          w-6 h-6 rounded-full bg-primary text-white cursor-pointer
          items-center justify-center shadow-lg
          transition-all duration-200 hover:scale-110 border-0
          ${dir === "rtl" ? "-left-3" : "-right-3"}
        `}
        aria-label="Toggle sidebar"
      >
        <CollapseIcon size={14} />
      </button>
    </aside>
  );
}
