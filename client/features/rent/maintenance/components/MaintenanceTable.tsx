import type { MaintenanceRequest, TranslateFn } from "../types";
import { MaintenanceTableRow } from "./MaintenanceTableRow";

interface MaintenanceTableProps {
  requests: MaintenanceRequest[];
  locale: string;
  resolvePropertyName: (id: string) => string;
  resolveTenantName: (id: string) => string;
  onEdit: (request: MaintenanceRequest) => void;
  onDelete: (id: string) => void;
  t: TranslateFn;
}

export function MaintenanceTable({
  requests,
  locale,
  resolvePropertyName,
  resolveTenantName,
  onEdit,
  onDelete,
  t,
}: MaintenanceTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border bg-background">
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("maintenanceTitle")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("property")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("tenant")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("priority")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("status")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("maintenanceCost")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("createdAt")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                {t("noResults")}
              </td>
            </tr>
          ) : (
            requests.map((request) => (
              <MaintenanceTableRow
                key={request.id}
                request={request}
                locale={locale}
                propertyName={resolvePropertyName(request.propertyId)}
                tenantName={resolveTenantName(request.tenantId)}
                onEdit={onEdit}
                onDelete={onDelete}
                t={t}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
