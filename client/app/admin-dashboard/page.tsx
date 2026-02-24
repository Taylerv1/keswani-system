"use client";

import { useTranslation } from "@/lib/translation";
import { Home, Zap, TrendingUp, Users } from "lucide-react";

interface StatCard {
  labelKey: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const stats: StatCard[] = [
  {
    labelKey: "rent",
    value: "—",
    icon: <Home size={22} />,
    color: "text-card-green",
    bgColor: "bg-card-green-light",
  },
  {
    labelKey: "electricity",
    value: "—",
    icon: <Zap size={22} />,
    color: "text-card-blue",
    bgColor: "bg-card-blue-light",
  },
  {
    labelKey: "profile",
    value: "—",
    icon: <Users size={22} />,
    color: "text-card-orange",
    bgColor: "bg-card-orange-light",
  },
  {
    labelKey: "dashboard",
    value: "—",
    icon: <TrendingUp size={22} />,
    color: "text-card-red",
    bgColor: "bg-card-red-light",
  },
];

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">
        {t("dashboard")}
      </h1>
      <p className="text-text-secondary text-sm mb-6">{t("welcome")}</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
        {stats.map((card) => (
          <div
            key={card.labelKey}
            className="bg-surface rounded-xl p-3 sm:p-5 flex items-center gap-3 sm:gap-4 border border-surface-border hover:shadow-lg transition-shadow duration-200"
          >
            <div
              className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center shrink-0`}
            >
              {card.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-sm text-text-secondary leading-snug">{t(card.labelKey)}</p>
              <p className="text-sm sm:text-xl font-bold text-text-primary leading-tight">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
