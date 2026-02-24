// ============================================================
// Property Module — Mobile Card
// ============================================================

import {
  Pencil,
  Trash2,
  Building2,
  Home,
  Eye,
} from "lucide-react";
import { StatusBadge } from "@/components/ui";
import type { Property } from "../types";
import { getPropertyOccupancyStatus, getPropertyAddress } from "../utils";

interface PropertyMobileCardProps {
  property: Property;
  onView: (id: string) => void;
  onEdit: (p: Property) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}

export function PropertyMobileCard({
  property: p,
  onView,
  onEdit,
  onDelete,
  t,
}: PropertyMobileCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-surface-border p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-card-blue-light text-card-blue flex items-center justify-center shrink-0">
            {p.type === "house" ? <Home size={16} /> : <Building2 size={16} />}
          </div>
          <div>
            <div className="font-medium text-text-primary">{p.name}</div>
            <div className="text-xs text-text-secondary">
              {getPropertyAddress(p)}
            </div>
          </div>
        </div>
        <StatusBadge status={getPropertyOccupancyStatus(p)} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary mb-3">
        <div>
          <div className="text-[11px]">{t("units")}</div>
          <div className="font-medium text-text-primary">
            {p.rented_units} / {p.total_units}
          </div>
        </div>
        <div>
          <div className="text-[11px]">{t("manager")}</div>
          <div className="font-medium text-text-primary">
            {p.manager_name ?? "-"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => void onView(p.id)}
          className="h-9 px-3 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-card-blue hover:border-card-blue transition-colors text-sm font-medium cursor-pointer flex items-center gap-2"
        >
          <Eye size={14} />
          {t("view")}
        </button>
        <button
          onClick={() => void onEdit(p)}
          className="h-9 px-3 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all"
        >
          <Pencil size={14} />
          {t("edit")}
        </button>
        <button
          onClick={() => onDelete(p.id)}
          className="h-9 px-3 rounded-lg border border-surface-border text-text-secondary hover:text-card-red hover:border-card-red transition-colors text-sm font-medium cursor-pointer flex items-center gap-2"
        >
          <Trash2 size={14} />
          {t("delete")}
        </button>
      </div>
    </div>
  );
}
