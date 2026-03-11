import { Modal, StatusBadge } from "@/components/ui";
import type { MaintenanceRequest, TranslateFn } from "../types";

interface MaintenanceViewModalProps {
  open: boolean;
  item: MaintenanceRequest | null;
  locale: string;
  onClose: () => void;
  onReview: (request: MaintenanceRequest) => void;
  t: TranslateFn;
}

function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale);
}

export function MaintenanceViewModal({
  open,
  item,
  locale,
  onClose,
  onReview,
  t,
}: MaintenanceViewModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={t("maintenanceDetails")} maxWidth="max-w-xl">
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
                <StatusBadge status={item.priority} />
              </div>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("property")}</p>
              <p className="text-sm font-medium text-text-primary">{item.propertyName}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("unitNumber")}</p>
              <p className="text-sm font-medium text-text-primary">{item.unitNumber}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("tenant")}</p>
              <p className="text-sm font-medium text-text-primary">{item.tenantName || "-"}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("assignedTo")}</p>
              <p className="text-sm font-medium text-text-primary">
                {item.assigneeName || t("unassigned")}
              </p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("createdAt")}</p>
              <p className="text-sm font-medium text-text-primary">
                {formatDate(item.createdAt, locale)}
              </p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("updatedAt")}</p>
              <p className="text-sm font-medium text-text-primary">
                {formatDate(item.updatedAt, locale)}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer"
            >
              {t("close")}
            </button>
            <button
              onClick={() => onReview(item)}
              className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0"
            >
              {item.status === "open" && !item.assigneeId ? t("review") : t("edit")}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

