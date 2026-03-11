import { Download } from "lucide-react";
import { Modal, StatusBadge } from "@/components/ui";
import type { ContractListItem } from "../types";
import { formatDateOnly, toNumber } from "../utils";

interface ContractDetailsModalProps {
  open: boolean;
  t: (key: string) => string;
  item: ContractListItem | null;
  onClose: () => void;
}

export function ContractDetailsModal({
  open,
  t,
  item,
  onClose,
}: ContractDetailsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={t("contractDetails")} maxWidth="max-w-lg">
      {item && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("contractId")}</p>
              <p className="text-sm font-medium text-text-primary">{item.id}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("status")}</p>
              <StatusBadge status={item.status} />
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("tenant")}</p>
              <p className="text-sm font-medium text-text-primary">{item.client_name}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("property")}</p>
              <p className="text-sm font-medium text-text-primary">{item.property_name} - {item.unit_number}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("startDate")}</p>
              <p className="text-sm font-medium text-text-primary">{formatDateOnly(item.start_date)}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("endDate")}</p>
              <p className="text-sm font-medium text-text-primary">{formatDateOnly(item.end_date)}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("monthlyRent")}</p>
              <p className="text-sm font-medium text-text-primary">${toNumber(item.monthly_rent).toLocaleString()}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("deposit")}</p>
              <p className="text-sm font-medium text-text-primary">${toNumber(item.deposit_amount).toLocaleString()}</p>
            </div>
            <div className="bg-background rounded-lg p-3 col-span-2">
              <p className="text-xs text-text-muted">{t("notes")}</p>
              <p className="text-sm font-medium text-text-primary">{item.notes || "—"}</p>
            </div>
          </div>
          <button disabled className="w-full h-10 rounded-lg border border-surface-border text-text-secondary opacity-60 cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2 bg-transparent">
            <Download size={16} />
            {t("comingSoon")}
          </button>
        </div>
      )}
    </Modal>
  );
}
