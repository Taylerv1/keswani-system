"use client";

import { Modal, StatusBadge } from "@/components/ui";
import type { TenantDetail } from "../types";
import { formatNullable } from "../utils";

interface TenantViewModalProps {
  open: boolean;
  tenant: TenantDetail | null;
  onClose: () => void;
  onInvite?: (id: string) => void;
  actionLoading?: boolean;
  t: (key: string) => string;
}

function formatDate(dateValue: string | null | undefined): string {
  if (!dateValue) return "-";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString();
}

export function TenantViewModal({
  open,
  tenant,
  onClose,
  onInvite,
  actionLoading = false,
  t,
}: TenantViewModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={t("tenantDetails")} maxWidth="max-w-3xl">
      {!tenant ? (
        <p className="text-sm text-text-muted">{t("noDataYet")}</p>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{tenant.full_name}</h3>
            <p className="text-sm text-text-secondary">{formatNullable(tenant.email)}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("phone")}</p>
              <p className="text-sm font-medium text-text-primary">{formatNullable(tenant.phone)}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-text-muted">{t("portalAccess")}</p>
              <p className="text-sm font-medium text-text-primary">
                {tenant.auth_user_id ? t("portalLinked") : t("portalNotLinked")}
              </p>
            </div>
            <div className="bg-background rounded-lg p-3 sm:col-span-2">
              <p className="text-xs text-text-muted">{t("notes")}</p>
              <p className="text-sm font-medium text-text-primary">{formatNullable(tenant.notes)}</p>
            </div>
          </div>

          {onInvite && (
            <div className="flex justify-end gap-3">
              <button
                onClick={() => onInvite(tenant.id)}
                disabled={actionLoading || !tenant.email}
                className="h-10 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary hover:text-card-green hover:border-card-green transition-colors text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tenant.auth_user_id ? t("sendAccessLink") : t("inviteTenant")}
              </button>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text-primary">{t("contractsSummary")}</h4>
            {tenant.contracts.length === 0 ? (
              <div className="bg-background rounded-lg p-3 text-sm text-text-muted">{t("noDataYet")}</div>
            ) : (
              <div className="space-y-2">
                {tenant.contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="bg-background rounded-lg p-3 border border-surface-border"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-text-primary">
                        {contract.unit.property.name} - {contract.unit.unit_number}
                      </p>
                      <StatusBadge status={contract.status} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-secondary">
                      <p>
                        {t("startDate")}: <span className="text-text-primary">{formatDate(contract.start_date)}</span>
                      </p>
                      <p>
                        {t("endDate")}: <span className="text-text-primary">{formatDate(contract.end_date)}</span>
                      </p>
                      <p>
                        {t("monthlyRent")}: <span className="text-text-primary">{String(contract.monthly_rent)} {contract.currency}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text-primary">{t("recentPayments")}</h4>
            {tenant.contracts.flatMap((contract) => contract.rent_payments).length === 0 ? (
              <div className="bg-background rounded-lg p-3 text-sm text-text-muted">{t("noDataYet")}</div>
            ) : (
              <div className="space-y-2">
                {tenant.contracts
                  .flatMap((contract) => contract.rent_payments)
                  .slice(0, 10)
                  .map((payment) => (
                    <div
                      key={payment.id}
                      className="bg-background rounded-lg p-3 border border-surface-border flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {String(payment.amount)} {payment.currency}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {t("dueDate")}: {formatDate(payment.payment_date)}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {t("paymentDate")}: {formatDate(payment.paid_at)}
                        </p>
                      </div>
                      <StatusBadge status={payment.status} />
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text-primary">{t("recentMaintenance")}</h4>
            {tenant.maintenance_requests.length === 0 ? (
              <div className="bg-background rounded-lg p-3 text-sm text-text-muted">{t("noDataYet")}</div>
            ) : (
              <div className="space-y-2">
                {tenant.maintenance_requests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-background rounded-lg p-3 border border-surface-border flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{request.title}</p>
                      <p className="text-xs text-text-secondary">{formatDate(request.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={request.priority} />
                      <StatusBadge status={request.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
