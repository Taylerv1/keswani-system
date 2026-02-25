import { Pencil, Trash2, Wrench } from "lucide-react";
import type { MaintenanceRequest, TranslateFn } from "../types";

interface MaintenanceMobileCardProps {
  request: MaintenanceRequest;
  locale: string;
  propertyName: string;
  onEdit: (request: MaintenanceRequest) => void;
  onDelete: (id: string) => void;
  t: TranslateFn;
}

export function MaintenanceMobileCard({
  request,
  locale,
  propertyName,
  onEdit,
  onDelete,
  t,
}: MaintenanceMobileCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-surface-border p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-card-blue-light text-card-blue flex items-center justify-center shrink-0">
            <Wrench size={16} />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-text-primary">
              {locale === "ar" ? request.titleAr : request.title}
            </div>
            <div className="text-xs text-text-secondary truncate">
              {locale === "ar" ? request.descriptionAr : request.description}
            </div>
          </div>
        </div>
        <div className="text-xs text-text-secondary">{request.createdAt}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary mb-3">
        <div>
          <div className="text-[11px]">{t("property")}</div>
          <div className="font-medium text-text-primary">
            {propertyName} - {request.unitNumber}
          </div>
        </div>
        <div>
          <div className="text-[11px]">{t("priority")}</div>
          <div className="font-medium text-text-primary">{request.priority}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(request)}
          className="h-9 px-3 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-primary hover:border-primary transition-colors text-sm font-medium cursor-pointer flex items-center gap-2"
        >
          <Pencil size={14} />
          {t("edit")}
        </button>
        <button
          onClick={() => onDelete(request.id)}
          className="h-9 px-3 rounded-lg border border-surface-border text-text-secondary hover:text-card-red hover:border-card-red transition-colors text-sm font-medium cursor-pointer flex items-center gap-2"
        >
          <Trash2 size={14} />
          {t("delete")}
        </button>
      </div>
    </div>
  );
}
