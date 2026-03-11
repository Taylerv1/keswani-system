import { Ban, Eye } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import type { ContractListItem } from "../types";
import { formatDateOnly } from "../utils";

interface ContractMobileCardProps {
  contract: ContractListItem;
  t: (key: string) => string;
  onView: (contract: ContractListItem) => void;
  onTerminate: (contractId: string) => void;
}

export function ContractMobileCard({
  contract,
  t,
  onView,
  onTerminate,
}: ContractMobileCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-surface-border p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-medium text-text-primary">{contract.client_name}</div>
          <div className="text-xs text-text-secondary">{contract.property_name} - {contract.unit_number}</div>
        </div>
        <StatusBadge status={contract.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary mb-3">
        <div>
          <div className="text-[11px]">{t("startDate")}</div>
          <div className="font-medium text-text-primary">{formatDateOnly(contract.start_date)}</div>
        </div>
        <div>
          <div className="text-[11px]">{t("endDate")}</div>
          <div className="font-medium text-text-primary">{formatDateOnly(contract.end_date)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => onView(contract)} className="h-9 px-3 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-card-blue hover:border-card-blue transition-colors text-sm font-medium cursor-pointer flex items-center gap-2">
          <Eye size={14} />
          {t("view")}
        </button>

        {(contract.status === "active" || contract.status === "pending") && (
          <button onClick={() => onTerminate(contract.id)} className="h-9 px-3 rounded-lg border border-surface-border text-text-secondary hover:text-card-red hover:border-card-red transition-colors text-sm font-medium cursor-pointer flex items-center gap-2">
            <Ban size={14} />
            {t("terminate")}
          </button>
        )}
      </div>
    </div>
  );
}
