// ============================================================
// Property Module — Desktop Table (md+)
// ============================================================

import { LoadingLottie } from "@/components/ui";
import type { Property } from "../types";
import { PropertyTableRow } from "./PropertyTableRow";

interface PropertyTableProps {
  properties: Property[];
  loading: boolean;
  actionLoading: boolean;
  onView: (id: string) => void;
  onEdit: (p: Property) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}

export function PropertyTable({
  properties,
  loading,
  actionLoading,
  onView,
  onEdit,
  onDelete,
  t,
}: PropertyTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border bg-background">
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">
              {t("propertyName")}
            </th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">
              {t("propertyType")}
            </th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">
              {t("address")}
            </th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">
              {t("units")}
            </th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">
              {t("manager")}
            </th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">
              {t("status")}
            </th>
            <th className="text-start px-4 py-3 font-semibold text-text-secondary">
              {t("actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {properties.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-8 text-center text-text-muted"
              >
                {loading ? (
                  <div className="flex justify-center">
                    <LoadingLottie size={120} className="p-4" />
                  </div>
                ) : (
                  t("noResults")
                )}
              </td>
            </tr>
          ) : (
            properties.map((p) => (
              <PropertyTableRow
                key={p.id}
                property={p}
                actionLoading={actionLoading}
                onView={onView}
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
