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
    <div className="kpi-card bg-surface rounded-xl p-3 md:p-5 border border-surface-border hover:shadow-lg transition-shadow duration-200 flex items-center gap-2.5 md:gap-4">
      <div
        className={`kpi-icon w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl ${bgColor} ${color} flex items-center justify-center shrink-0 [&>svg]:w-4 [&>svg]:h-4 md:[&>svg]:w-[22px] md:[&>svg]:h-[22px]`}
      >
        {icon}
      </div>
      <div className="kpi-content min-w-0 flex-1">
        <div className="kpi-text flex">
          <p className="kpi-label text-[11px] md:text-sm text-text-secondary leading-snug truncate">{label}</p>
          <p className="kpi-value text-sm md:text-lg font-semibold text-text-primary leading-tight whitespace-nowrap">{value}</p>
        </div>
        {trend && (
          <p className="kpi-trend text-[10px] md:text-xs text-text-muted mt-0.5 leading-snug truncate">{trend}</p>
        )}
      </div>
    </div>
  );
}
