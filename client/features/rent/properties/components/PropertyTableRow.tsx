// ============================================================
// Property Module — Single Table Row
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

interface PropertyTableRowProps {
  property: Property;
  actionLoading: boolean;
  onView: (property: Property) => void;
  onEdit: (p: Property) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}

export function PropertyTableRow({
  property: p,
  actionLoading,
  onView,
  onEdit,
  onDelete,
  t,
}: PropertyTableRowProps) {
  return (
    <tr className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-card-blue-light text-card-blue flex items-center justify-center shrink-0">
            {p.type === "house" ? <Home size={16} /> : <Building2 size={16} />}
          </div>
          <span className="font-medium text-text-primary">{p.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-text-secondary">{t(p.type)}</td>
      <td className="px-4 py-3 text-text-secondary">{getPropertyAddress(p)}</td>
      <td className="px-4 py-3">
        <span className="text-card-green font-medium">{p.rented_units}</span>
        <span className="text-text-muted"> / {p.total_units}</span>
      </td>
      <td className="px-4 py-3 font-medium text-text-primary">
        {p.manager_name ?? "-"}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={getPropertyOccupancyStatus(p)} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(p)}
            disabled={actionLoading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0"
            title={t("view")}
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => void onEdit(p)}
            disabled={actionLoading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0"
            title={t("edit")}
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(p.id)}
            disabled={actionLoading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0"
            title={t("delete")}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}
