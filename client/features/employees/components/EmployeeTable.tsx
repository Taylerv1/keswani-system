// ============================================================
// Employee Table Component
// ============================================================

"use client";

import { Edit2, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import { useTranslation } from "@/lib/translation";
import type { EmployeeDto } from "../types";

interface EmployeeTableProps {
  employees: EmployeeDto[];
  onEdit: (employee: EmployeeDto) => void;
  onDelete: (employee: EmployeeDto) => void;
  isLoading?: boolean;
}

export function EmployeeTable({
  employees,
  onEdit,
  onDelete,
  isLoading = false,
}: EmployeeTableProps) {
  const { t } = useTranslation();

  if (employees.length === 0) {
    return (
      <div className="p-6 text-center text-text-secondary">
        {t("noEmployeesFound")}
      </div>
    );
  }

  return (
    <div className="hidden md:block overflow-x-auto border border-surface-border rounded-lg">
      <table className="w-full">
        <thead className="bg-surface">
          <tr className="border-b border-surface-border">
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
              {t("name")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
              {t("email")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
              {t("phone")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
              {t("role")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
              {t("status")}
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase">
              {t("actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr
              key={employee.id}
              className="border-b border-surface-border hover:bg-background/50 transition-colors"
            >
              <td className="px-4 py-3 text-sm font-medium text-text-primary">
                {employee.full_name}
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary">
                {employee.email}
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary">
                {employee.phone}
              </td>
              <td className="px-4 py-3 text-sm">
                <StatusBadge status={employee.role} variant="secondary" />
              </td>
              <td className="px-4 py-3 text-sm">
                <StatusBadge
                  status={employee.is_active ? "active" : "inactive"}
                />
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEdit(employee)}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-50 cursor-pointer"
                    title={t("edit")}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(employee)}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50 cursor-pointer"
                    title={t("delete")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
