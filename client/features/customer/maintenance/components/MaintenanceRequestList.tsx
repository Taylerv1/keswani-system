import { Wrench } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import type { CustomerMaintenanceItem } from "../types";
import { formatDate } from "../utils";

interface MaintenanceRequestListProps {
  items: CustomerMaintenanceItem[];
  locale: string;
  t: (key: string) => string;
}

export function MaintenanceRequestList({
  items,
  locale,
  t,
}: MaintenanceRequestListProps) {
  if (items.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-surface-border p-8 text-center">
        <Wrench size={36} className="mx-auto text-text-muted mb-3" />
        <p className="text-text-secondary text-sm">{t("custNoMaintenanceRequests")}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-border">
        <h3 className="text-sm font-semibold text-text-primary">
          {t("custPreviousMaintenanceRequests")}
        </h3>
      </div>

      <div className="divide-y divide-surface-border">
        {items.map((item) => (
          <div
            key={item.id}
            className="px-5 py-4 hover:bg-background/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {item.title}
                </p>
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                  {item.description || "-"}
                </p>
              </div>

              <div className="shrink-0">
                <StatusBadge status={item.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
              <p>
                {t("property")}: {item.propertyName} - {item.unitNumber}
              </p>
              <p className="text-end">
                {t("priority")}: <span className="font-medium">{t(item.priority)}</span>
              </p>
              <p>
                {t("createdAt")}: {formatDate(item.createdAt, locale)}
              </p>
              <p className="text-end">
                {t("updatedAt")}: {formatDate(item.updatedAt, locale)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

