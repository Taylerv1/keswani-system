"use client";

import { Eye, Pencil } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import type { TenantListItem } from "../types";
import { formatNullable } from "../utils";

interface TenantMobileCardProps {
  tenant: TenantListItem;
  onView: (item: TenantListItem) => void;
  onEdit: (item: TenantListItem) => void;
  actionLoading: boolean;
  t: (key: string) => string;
}

export function TenantMobileCard({
  tenant,
  onView,
  onEdit,
  actionLoading,
  t,
}: TenantMobileCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-surface-border p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-medium text-text-primary">{tenant.full_name}</div>
          <div className="text-xs text-text-muted">{formatNullable(tenant.phone)}</div>
        </div>
        {tenant.active_contract ? (
          <StatusBadge status="active" />
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-background text-text-secondary">
            {t("noContract")}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary mb-3">
        <div>
          <div className="text-[11px]">{t("property")}</div>
          <div className="font-medium text-text-primary">{tenant.active_contract?.property_name ?? "-"}</div>
        </div>
        <div>
          <div className="text-[11px]">{t("unitNumber")}</div>
          <div className="font-medium text-text-primary">{tenant.active_contract?.unit_number ?? "-"}</div>
        </div>
        <div className="col-span-2">
          <div className="text-[11px]">{t("email")}</div>
          <div className="font-medium text-text-primary">{formatNullable(tenant.email)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onView(tenant)}
          disabled={actionLoading}
          className="h-9 px-3 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-card-blue hover:border-card-blue transition-colors text-sm font-medium cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eye size={14} />
          {t("view")}
        </button>
        <button
          onClick={() => onEdit(tenant)}
          disabled={actionLoading}
          className="h-9 px-3 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Pencil size={14} />
          {t("edit")}
        </button>
      </div>
    </div>
  );
}
