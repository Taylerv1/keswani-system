"use client";

import { useTranslation } from "@/lib/translation-context";
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((card) => (
          <div
            key={card.labelKey}
            className="bg-surface rounded-xl p-5 flex items-center gap-4 border border-surface-border hover:shadow-lg transition-shadow duration-200"
          >
            <div
              className={`w-12 h-12 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center shrink-0`}
            >
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-text-secondary">{t(card.labelKey)}</p>
              <p className="text-xl font-bold text-text-primary">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
