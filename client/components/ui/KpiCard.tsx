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
    <div className="kpi-card bg-surface rounded-xl p-2.5 md:p-3 border border-surface-border hover:shadow-lg transition-shadow duration-200 flex items-center gap-2 md:gap-2.5">
      <div
        className={`kpi-icon w-7 h-7 md:w-9 md:h-9 rounded-lg ${bgColor} ${color} flex items-center justify-center shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 md:[&>svg]:w-4 md:[&>svg]:h-4`}
      >
        {icon}
      </div>
      <div className="kpi-content min-w-0 flex-1">
        <p className="kpi-label text-[9px] md:text-[10px] text-text-secondary leading-snug">{label}</p>
        <p className="kpi-value text-xs md:text-sm font-semibold text-text-primary leading-tight mt-0.5 truncate">{value}</p>
        {trend && (
          <p className="kpi-trend text-[8px] md:text-[9px] text-text-muted mt-0.5 leading-snug truncate">{trend}</p>
        )}
      </div>
    </div>
  );
}
