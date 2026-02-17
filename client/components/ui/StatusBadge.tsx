"use client";

import { useTranslation } from "@/lib/translation-context";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const variantMap: Record<string, "success" | "warning" | "danger" | "info"> = {
  active: "success",
  paid: "success",
  completed: "success",
  read: "info",
  rented: "success",
  vacant: "warning",
  inactive: "danger",
  expired: "danger",
  terminated: "danger",
  overdue: "danger",
  late: "danger",
  open: "info",
  in_progress: "warning",
  inProgress: "warning",
  pending: "warning",
  high: "danger",
  medium: "warning",
  low: "info",
  closed: "info",
  unread: "warning",
  underMaintenance: "warning",
};

const variantClasses: Record<string, string> = {
  success: "bg-card-green-light text-card-green",
  warning: "bg-card-orange-light text-card-orange",
  danger: "bg-card-red-light text-card-red",
  info: "bg-card-blue-light text-card-blue",
  default: "bg-background text-text-secondary",
};

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  const { t } = useTranslation();
  const v = variant ?? variantMap[status] ?? "default";

  const displayKey =
    status === "in_progress" ? "inProgress" : status === "under_maintenance" ? "underMaintenance" : status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantClasses[v]}`}
    >
      {t(displayKey)}
    </span>
  );
}
