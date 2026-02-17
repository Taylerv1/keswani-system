"use client";

import { Receipt, UserPlus, DollarSign, Gauge, FileText, Wrench } from "lucide-react";
import { useTranslation } from "@/lib/translation-context";

interface TimelineItem {
  id: string;
  action: string;
  detail: string;
  detailAr: string;
  timestamp: string;
  icon: string;
}

interface ActivityTimelineProps {
  items: TimelineItem[];
}

const iconMap: Record<string, React.ReactNode> = {
  receipt: <Receipt size={16} />,
  userPlus: <UserPlus size={16} />,
  dollarSign: <DollarSign size={16} />,
  gauge: <Gauge size={16} />,
  fileText: <FileText size={16} />,
  wrench: <Wrench size={16} />,
};

const colorMap: Record<string, { text: string; bg: string }> = {
  billGenerated: { text: "text-card-blue", bg: "bg-card-blue-light" },
  tenantAdded: { text: "text-card-green", bg: "bg-card-green-light" },
  paymentReceived: { text: "text-card-orange", bg: "bg-card-orange-light" },
  meterRead: { text: "text-card-red", bg: "bg-card-red-light" },
  contractSigned: { text: "text-card-blue", bg: "bg-card-blue-light" },
  maintenanceResolved: { text: "text-card-green", bg: "bg-card-green-light" },
};

export default function ActivityTimeline({ items }: ActivityTimelineProps) {
  const { t, locale } = useTranslation();

  const formatRelative = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3_600_000);
    const diffD = Math.floor(diffMs / 86_400_000);

    if (diffD === 0) return `${t("today")} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (diffD === 1) return `${t("yesterday")} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    return d.toLocaleDateString();
  };

  return (
    <div className="bg-surface rounded-2xl border border-surface-border p-6">
      <h2 className="text-base font-semibold text-text-primary mb-5">{t("recentActivity")}</h2>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute start-[18px] top-3 bottom-3 w-px bg-surface-border" />

        <div className="space-y-1">
          {items.map((item, i) => {
            const colors = colorMap[item.action] ?? { text: "text-card-blue", bg: "bg-card-blue-light" };
            return (
              <div
                key={item.id}
                className="relative flex items-start gap-4 p-3 rounded-xl hover:bg-background transition-colors duration-200 group"
              >
                <div className={`relative z-10 w-9 h-9 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110`}>
                  {iconMap[item.icon] ?? <Receipt size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {t(item.action)}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    {locale === "ar" ? item.detailAr : item.detail}
                  </p>
                </div>
                <span className="text-[11px] text-text-muted whitespace-nowrap pt-0.5">
                  {formatRelative(item.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
