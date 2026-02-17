"use client";

import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  bgColor: string;
  trend?: string;
}

export default function KpiCard({
  label,
  value,
  icon,
  color,
  bgColor,
  trend,
}: KpiCardProps) {
  return (
    <div className="bg-surface rounded-xl p-5 border border-surface-border hover:shadow-lg transition-shadow duration-200 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl ${bgColor} ${color} flex items-center justify-center shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-text-secondary truncate">{label}</p>
        <p className="text-xl font-bold text-text-primary">{value}</p>
        {trend && (
          <p className="text-xs text-text-muted mt-0.5">{trend}</p>
        )}
      </div>
    </div>
  );
}
