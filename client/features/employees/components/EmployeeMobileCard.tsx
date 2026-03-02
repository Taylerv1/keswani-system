// ============================================================
// Employee Mobile Card Component
// ============================================================

"use client";

import { Edit2, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import { useTranslation } from "@/lib/translation";
import type { EmployeeDto } from "../types";

interface EmployeeMobileCardProps {
  employee: EmployeeDto;
  onEdit: (employee: EmployeeDto) => void;
  onDelete: (employee: EmployeeDto) => void;
  isLoading?: boolean;
}

export function EmployeeMobileCard({
  employee,
  onEdit,
  onDelete,
  isLoading = false,
}: EmployeeMobileCardProps) {
  const { t } = useTranslation();
  return (
    <div className="md:hidden bg-surface border border-surface-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="font-semibold text-text-primary">{employee.full_name}</h3>
          <p className="text-xs text-text-secondary mt-1">{employee.email}</p>
        </div>
        <StatusBadge
          status={employee.is_active ? "active" : "inactive"}
        />
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-text-secondary">{t("phone")}:</span>
          <span className="text-text-primary font-medium">{employee.phone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">{t("role")}:</span>
          <span className="text-text-primary font-medium">
            <StatusBadge status={employee.role} variant="secondary" />
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">{t("address")}:</span>
          <span className="text-text-primary font-medium text-right max-w-xs">
            {employee.address}
          </span>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-surface-border">
        <button
          onClick={() => onEdit(employee)}
          disabled={isLoading}
          className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          <Edit2 size={14} />
          {t("edit")}
        </button>
        <button
          onClick={() => onDelete(employee)}
          disabled={isLoading}
          className="flex-1 py-2 rounded-lg bg-red-50 text-red-500 text-sm font-medium hover:bg-red-100 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          <Trash2 size={14} />
          {t("delete")}
        </button>
      </div>
    </div>
  );
}
