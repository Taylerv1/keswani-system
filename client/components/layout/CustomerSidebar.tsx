"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Home,
    LifeBuoy,
    Zap,
    User,
    LogOut,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
} from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { logout } from "@/lib/helpers/auth-client";
import { useCustomer } from "@/features/profile/context/customer-context";

interface NavItem {
    key: string;
    href: string;
    icon: React.ReactNode;
}

interface CustomerSidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

export default function CustomerSidebar({
    collapsed,
    onToggle,
    mobileOpen = false,
    onMobileClose,
}: CustomerSidebarProps) {
    const pathname = usePathname();
    const safePathname = pathname ?? "";
    const router = useRouter();
    const { t, dir } = useTranslation();
    const { hasRentData, hasElectricityData } = useCustomer();

    const handleLogout = () => {
        router.replace("/login");
        logout();
    };

    const navItems: NavItem[] = [
        {
            key: "custOverview",
            href: "/dashboard",
            icon: <LayoutDashboard size={20} />,
        },
        ...(hasRentData
            ? [
                {
                    key: "custRentHistory",
                    href: "/dashboard/rent-history",
                    icon: <Home size={20} />,
                },
            ]
            : []),
        ...(hasElectricityData
            ? [
                {
                    key: "custElecHistory",
                    href: "/dashboard/electricity-history",
                    icon: <Zap size={20} />,
                },
            ]
            : []),
        {
            key: "custSupport",
            href: "/dashboard/support",
            icon: <LifeBuoy size={20} />,
        },
        {
            key: "custProfile",
            href: "/dashboard/profile",
            icon: <User size={20} />,
        },
    ];

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
            <nav dir={dir} className={`scrollbar-primary flex-1 py-4 px-2 space-y-1 overflow-y-auto ${dir === "rtl" ? "scrollbar-left" : "scrollbar-right"}`}>
                {navItems.map((item) => {
                    const isActive =
                        item.href === "/dashboard"
                            ? safePathname === "/dashboard"
                            : safePathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 no-underline
                                ${isActive
                                    ? "bg-primary text-sidebar-text-active shadow-lg"
                                    : "text-sidebar-text hover:bg-white/8 hover:text-sidebar-text-active"
                                }
                                ${collapsed ? "md:justify-center md:px-0" : ""}
                            `}
                            title={collapsed ? t(item.key) : undefined}
                            onClick={onMobileClose}
                        >
                            <span className="shrink-0">{item.icon}</span>
                            <span className={`text-sm font-medium ${dir === "rtl" ? "mr-1" : "ml-1"} ${collapsed ? "md:hidden" : ""}`}>
                                {t(item.key)}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom actions */}
            <div dir={dir} className="py-4 px-2 border-t border-white/10 space-y-1">
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
                    <span className={`text-sm font-medium ${dir === "rtl" ? "mr-1" : "ml-1"} ${collapsed ? "md:hidden" : ""}`}>{t("logout")}</span>
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
