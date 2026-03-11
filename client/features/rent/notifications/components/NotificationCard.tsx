import type { ReactNode } from "react";
import {
  Bell,
  Building2,
  Check,
  CreditCard,
  Eye,
  FileText,
  Loader2,
  Wrench,
} from "lucide-react";
import type { NotificationItem } from "../types";
import { formatDateValue, isNotificationDetailSupported } from "../utils";

interface NotificationCardProps {
  item: NotificationItem;
  locale: string;
  viewLoading: boolean;
  onView: (item: NotificationItem) => void;
  onMarkRead: (id: string) => void;
  t: (key: string) => string;
}

const typeIcons: Record<string, ReactNode> = {
  late_payment: <CreditCard size={16} />,
  contract_ending: <FileText size={16} />,
  maintenance: <Wrench size={16} />,
  vacant_property: <Building2 size={16} />,
};

const typeColors: Record<string, { bg: string; text: string }> = {
  late_payment: { bg: "bg-card-red-light", text: "text-card-red" },
  contract_ending: { bg: "bg-card-orange-light", text: "text-card-orange" },
  maintenance: { bg: "bg-card-blue-light", text: "text-card-blue" },
  vacant_property: { bg: "bg-card-green-light", text: "text-card-green" },
};

export function NotificationCard({
  item,
  locale,
  viewLoading,
  onView,
  onMarkRead,
  t,
}: NotificationCardProps) {
  const colors = typeColors[item.type] ?? typeColors.maintenance;
  const canViewDetails = isNotificationDetailSupported(item);

  return (
    <div
      className={`bg-surface rounded-xl border p-4 flex items-start gap-4 transition-all ${
        item.read ? "border-surface-border" : "border-primary/30 shadow-sm"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}
      >
        {typeIcons[item.type] ?? <Bell size={16} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-semibold text-text-primary">{item.title}</h3>
          {!item.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
        </div>
        <p className="text-sm text-text-secondary">{item.message}</p>
        <p className="text-xs text-text-muted mt-1">
          {formatDateValue(item.createdAt, locale)}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {canViewDetails && (
          <button
            type="button"
            onClick={() => onView(item)}
            disabled={viewLoading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0 disabled:opacity-60 disabled:cursor-not-allowed"
            title={t("view")}
          >
            {viewLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Eye size={16} />
            )}
          </button>
        )}

        {!item.read && (
          <button
            type="button"
            onClick={() => onMarkRead(item.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-green hover:bg-card-green-light transition-colors cursor-pointer bg-transparent border-0"
            title={t("markAsRead")}
          >
            <Check size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
