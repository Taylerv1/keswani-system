import { Ban, Eye, FileText } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import type { ContractListItem } from "../types";
import { formatDateOnly, getDaysRemaining, toNumber } from "../utils";

interface ContractTableProps {
  contracts: ContractListItem[];
  t: (key: string) => string;
  onView: (contract: ContractListItem) => void;
  onTerminate: (contractId: string) => void;
}

export function ContractTable({
  contracts,
  t,
  onView,
  onTerminate,
}: ContractTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border bg-background">
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("contractId")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("tenant")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("property")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("monthlyRent")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("endDate")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("status")}</th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {contracts.length === 0 ? (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">{t("noResults")}</td></tr>
          ) : (
            contracts.map((contract) => {
              const days = getDaysRemaining(contract.end_date);
              const ending = contract.status === "active" && days <= 60 && days > 0;
              return (
                <tr key={contract.id} className="border-b border-surface-border last:border-0 hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-text-muted" />
                      <span className="font-medium text-text-primary">{contract.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{contract.client_name}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {contract.property_name} - {contract.unit_number}
                  </td>
                  <td className="px-4 py-3 font-medium text-text-primary">${toNumber(contract.monthly_rent).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="text-text-secondary">{formatDateOnly(contract.end_date)}</span>
                    {ending && (
                      <span className="block text-xs text-card-orange font-medium mt-0.5">
                        {days} {t("daysRemaining")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={contract.status} />
                    {ending && (
                      <span className="ms-1">
                        <StatusBadge status="endingSoon" variant="warning" />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onView(contract)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-blue hover:bg-card-blue-light transition-colors cursor-pointer bg-transparent border-0" title={t("view")}>
                        <Eye size={15} />
                      </button>

                      {(contract.status === "active" || contract.status === "pending") && (
                        <button onClick={() => onTerminate(contract.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-card-red hover:bg-card-red-light transition-colors cursor-pointer bg-transparent border-0" title={t("terminateContract")}>
                          <Ban size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
