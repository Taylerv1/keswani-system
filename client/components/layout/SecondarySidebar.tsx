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
  Bell,
  Gauge,
  BookOpen,
  Receipt,
  AlertTriangle,
  DollarSign,
  UserCog,
  BarChart3,
  Settings,
  Zap,
} from "lucide-react";
import { useTranslation } from "@/lib/translation-context";

interface SubNavItem {
  key: string;
  href: string;
  icon: React.ReactNode;
}

const rentSubNav: SubNavItem[] = [
  { key: "rentOverview", href: "/dashboard/rent", icon: <LayoutDashboard size={16} /> },
  { key: "rentProperties", href: "/dashboard/rent/properties", icon: <Building2 size={16} /> },
  { key: "rentTenants", href: "/dashboard/rent/tenants", icon: <Users size={16} /> },
  { key: "rentContracts", href: "/dashboard/rent/contracts", icon: <FileText size={16} /> },
  { key: "rentPayments", href: "/dashboard/rent/payments", icon: <CreditCard size={16} /> },
  { key: "rentMaintenance", href: "/dashboard/rent/maintenance", icon: <Wrench size={16} /> },
  { key: "rentNotifications", href: "/dashboard/rent/notifications", icon: <Bell size={16} /> },
];

const electricitySubNav: SubNavItem[] = [
  { key: "elecDashboard", href: "/dashboard/electricity", icon: <LayoutDashboard size={16} /> },
  { key: "elecAlerts", href: "/dashboard/electricity/alerts", icon: <AlertTriangle size={16} /> },
  { key: "elecSubscribers", href: "/dashboard/electricity/subscribers", icon: <Users size={16} /> },
  { key: "elecBuildings", href: "/dashboard/electricity/buildings", icon: <Building2 size={16} /> },
  { key: "elecMeters", href: "/dashboard/electricity/meters", icon: <Gauge size={16} /> },
  { key: "elecReadings", href: "/dashboard/electricity/readings", icon: <BookOpen size={16} /> },
  { key: "elecBills", href: "/dashboard/electricity/bills", icon: <Receipt size={16} /> },
  { key: "elecPayments", href: "/dashboard/electricity/payments", icon: <CreditCard size={16} /> },
  { key: "elecDebts", href: "/dashboard/electricity/debts", icon: <DollarSign size={16} /> },
  { key: "elecPricing", href: "/dashboard/electricity/pricing", icon: <Zap size={16} /> },
  { key: "elecEmployees", href: "/dashboard/electricity/employees", icon: <UserCog size={16} /> },
  { key: "elecReports", href: "/dashboard/electricity/reports", icon: <BarChart3 size={16} /> },
  { key: "elecSettings", href: "/dashboard/electricity/settings", icon: <Settings size={16} /> },
];

function getSubNav(pathname: string): { title: string; items: SubNavItem[] } | null {
  if (pathname.startsWith("/dashboard/rent")) {
    return { title: "rent", items: rentSubNav };
  }
  if (pathname.startsWith("/dashboard/electricity")) {
    return { title: "electricity", items: electricitySubNav };
  }
  return null;
}

export default function SecondarySidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const nav = getSubNav(pathname);
  if (!nav) return null;

  return (
    <aside className="w-[220px] h-full bg-surface border-e border-surface-border shrink-0 flex flex-col">
      {/* Title */}
      <div className="px-4 pt-5 pb-3">
        <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
          {t(nav.title)}
        </p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {nav.items.map((item) => {
          const isExact = pathname === item.href;
          const isActive =
            item.href === "/dashboard/rent" || item.href === "/dashboard/electricity"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const active = isExact || isActive;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm no-underline
                transition-all duration-150
                ${
                  active
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
    </aside>
  );
}
