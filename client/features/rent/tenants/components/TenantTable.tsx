"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import type { TenantListItem } from "../types";
import { formatNullable } from "../utils";

interface TenantTableProps {
  tenants: TenantListItem[];
  loading: boolean;
  actionLoading: boolean;
  onView: (item: TenantListItem) => void;
  onEdit: (item: TenantListItem) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}

function ContractPresenceBadge({
  hasContract,
  t,
}: {
  hasContract: boolean;
  t: (key: string) => string;
}) {
  if (hasContract) {
    return <StatusBadge status="active" />;
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-background text-text-secondary">
      {t("noContract")}
    </span>
  );
}

export function TenantTable({
  tenants,
  loading,
  actionLoading,
  onView,
  onEdit,
  onDelete,
  t,
}: TenantTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border bg-background">
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("tenantName")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("email")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("phone")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("property")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("unitNumber")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("contractStatus")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {!loading && tenants.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                {t("noResults")}
              </td>
            </tr>
          ) : (
            tenants.map((tenant) => (
              <tr
                key={tenant.id}
                className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-text-primary">{tenant.full_name}</div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{formatNullable(tenant.email)}</td>
                <td className="px-4 py-3 text-text-secondary">{formatNullable(tenant.phone)}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {tenant.active_contract?.property_name ?? "-"}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {tenant.active_contract?.unit_number ?? "-"}
                </td>
                <td className="px-4 py-3">
                  <ContractPresenceBadge hasContract={Boolean(tenant.active_contract)} t={t} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onView(tenant)}
                      disabled={actionLoading}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={t("view")}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => onEdit(tenant)}
                      disabled={actionLoading}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer bg-transparent border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={t("edit")}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => onDelete(tenant.id)}
                      disabled={actionLoading}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={t("delete")}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
