"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  CreditCard,
  Wrench,
  Gauge,
  BookOpen,
  Receipt,
  DollarSign,
  BarChart3,
  Settings,
  Zap,
  X,
} from "lucide-react";
import { useTranslation } from "@/lib/translation";

interface SubNavItem {
  key: string;
  href: string;
  icon: React.ReactNode;
}

const rentSubNav: SubNavItem[] = [
  { key: "rentOverview", href: "/admin-dashboard/rent", icon: <LayoutDashboard size={16} /> },
  { key: "rentProperties", href: "/admin-dashboard/rent/properties", icon: <Building2 size={16} /> },
  { key: "rentTenants", href: "/admin-dashboard/rent/tenants", icon: <Users size={16} /> },
  { key: "rentContracts", href: "/admin-dashboard/rent/contracts", icon: <FileText size={16} /> },
  { key: "rentPayments", href: "/admin-dashboard/rent/payments", icon: <CreditCard size={16} /> },
  { key: "rentMaintenance", href: "/admin-dashboard/rent/maintenance", icon: <Wrench size={16} /> },
];

const electricitySubNav: SubNavItem[] = [
  { key: "elecDashboard", href: "/admin-dashboard/electricity", icon: <LayoutDashboard size={16} /> },
  { key: "elecIssues", href: "/admin-dashboard/electricity/issues", icon: <Wrench size={16} /> },
  { key: "elecBuildings", href: "/admin-dashboard/electricity/buildings", icon: <Building2 size={16} /> },
  { key: "elecSubscribers", href: "/admin-dashboard/electricity/subscribers", icon: <Users size={16} /> },
  { key: "elecMeters", href: "/admin-dashboard/electricity/meters", icon: <Gauge size={16} /> },
  { key: "elecReadings", href: "/admin-dashboard/electricity/readings", icon: <BookOpen size={16} /> },
  { key: "elecBills", href: "/admin-dashboard/electricity/bills", icon: <Receipt size={16} /> },
  { key: "elecPayments", href: "/admin-dashboard/electricity/payments", icon: <CreditCard size={16} /> },
  { key: "elecDebts", href: "/admin-dashboard/electricity/debts", icon: <DollarSign size={16} /> },
  { key: "elecPricing", href: "/admin-dashboard/electricity/pricing", icon: <Zap size={16} /> },
  { key: "elecReports", href: "/admin-dashboard/electricity/reports", icon: <BarChart3 size={16} /> },
  { key: "elecSettings", href: "/admin-dashboard/electricity/settings", icon: <Settings size={16} /> },
];

function getSubNav(pathname: string): { title: string; items: SubNavItem[] } | null {
  if (pathname.startsWith("/admin-dashboard/rent")) {
    return { title: "rent", items: rentSubNav };
  }
  if (pathname.startsWith("/admin-dashboard/electricity")) {
    return { title: "electricity", items: electricitySubNav };
  }
  return null;
}

export default function SecondarySidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const safePathname = pathname ?? "";
  const { t, dir } = useTranslation();

  const nav = getSubNav(safePathname);
  if (!nav) return null;

  const navContent = (
    <>
      {/* Title row */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
          {t(nav.title)}
        </p>
        {/* Close button – mobile only */}
        <button
          onClick={onClose}
          className="md:hidden flex items-center justify-center w-7 h-7 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background transition-all cursor-pointer"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="scrollbar-primary flex-1 px-2 space-y-0.5 overflow-y-auto">
        {nav.items.map((item) => {
          const isExact = safePathname === item.href;
          const isActive =
            item.href === "/admin-dashboard/rent" || item.href === "/admin-dashboard/electricity"
              ? safePathname === item.href
              : safePathname.startsWith(item.href);
          const active = isExact || isActive;

          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onClose}
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm no-underline
                transition-all duration-150
                ${active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-text-secondary hover:bg-background hover:text-text-primary"
                }
              `}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop: inline sidebar */}
      <aside className="hidden md:flex w-[220px] h-full bg-surface border-e border-surface-border shrink-0 flex-col">
        {navContent}
      </aside>

      {/* Mobile: overlay drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          md:hidden fixed top-0 h-screen z-40 flex flex-col w-[260px]
          bg-surface
          transition-transform duration-300 ease-in-out
          ${dir === "rtl" ? "right-0" : "left-0"}
          ${mobileOpen
            ? "translate-x-0"
            : dir === "rtl"
              ? "translate-x-full"
              : "-translate-x-full"
          }
        `}
      >
        {navContent}
      </aside>
    </>
  );
}
