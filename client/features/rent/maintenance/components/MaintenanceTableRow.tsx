import { Pencil, Trash2, Wrench } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import { priorityDot } from "../utils";
import type { MaintenanceRequest, TranslateFn } from "../types";

interface MaintenanceTableRowProps {
  request: MaintenanceRequest;
  propertyName: string;
  tenantName: string;
  onEdit: (request: MaintenanceRequest) => void;
  onDelete: (id: string) => void;
  t: TranslateFn;
}

export function MaintenanceTableRow({
  request,
  propertyName,
  tenantName,
  onEdit,
  onDelete,
  t,
}: MaintenanceTableRowProps) {
  return (
    <tr className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Wrench size={14} className="text-text-muted shrink-0" />
          <div>
            <p className="font-medium text-text-primary">{request.title}</p>
            <p className="text-xs text-text-muted truncate max-w-[200px]">{request.description}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-text-secondary">
        {propertyName} - {request.unitNumber}
      </td>
      <td className="px-4 py-3 text-text-secondary">{tenantName}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${priorityDot(request.priority)}`} />
          <StatusBadge status={request.priority} />
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={request.status} />
      </td>
      <td className="px-4 py-3 text-text-primary">
        {request.cost != null ? `$${request.cost.toLocaleString()}` : "—"}
      </td>
      <td className="px-4 py-3 text-text-secondary">{request.createdAt}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(request)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0"
            title={t("edit")}
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(request.id)}
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
