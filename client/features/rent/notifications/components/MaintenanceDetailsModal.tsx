import { Modal, StatusBadge } from "@/components/ui";
import type { MaintenanceNotificationDetail } from "../types";
import {
  formatDateValue,
  normalizeMaintenancePriority,
  toNumber,
} from "../utils";

interface MaintenanceDetailsModalProps {
  open: boolean;
  item: MaintenanceNotificationDetail | null;
  onClose: () => void;
  t: (key: string) => string;
  locale: string;
}

export function MaintenanceDetailsModal({
  open,
  item,
  onClose,
  t,
  locale,
}: MaintenanceDetailsModalProps) {
  const cost = toNumber(item?.actual_cost) ?? toNumber(item?.estimated_cost);

  return (
    <Modal open={open} onClose={onClose} title={t("maintenanceNotif")} maxWidth="max-w-xl">
      {!item ? (
        <p className="text-sm text-text-muted">{t("noDataYet")}</p>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{item.title}</h3>
            <p className="text-sm text-text-secondary mt-1">{item.description || "-"}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("status")}</p>
              <div className="mt-1">
                <StatusBadge status={item.status} />
              </div>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("priority")}</p>
              <div className="mt-1">
                <StatusBadge status={normalizeMaintenancePriority(item.priority)} />
              </div>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("property")}</p>
              <p className="text-sm font-medium text-text-primary">{item.unit.property.name}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("unitNumber")}</p>
              <p className="text-sm font-medium text-text-primary">{item.unit.unit_number}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("tenant")}</p>
              <p className="text-sm font-medium text-text-primary">
                {item.requester?.full_name || "-"}
              </p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("maintenanceCost")}</p>
              <p className="text-sm font-medium text-text-primary">
                {cost == null ? "-" : `$${cost.toLocaleString()}`}
              </p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("createdAt")}</p>
              <p className="text-sm font-medium text-text-primary">
                {formatDateValue(item.created_at, locale)}
              </p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("updatedAt")}</p>
              <p className="text-sm font-medium text-text-primary">
                {formatDateValue(item.updated_at, locale)}
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
