"use client";

import { useTranslation } from "@/lib/translation-context";

interface SecondarySidebarProps {
  open: boolean;
}

export default function SecondarySidebar({ open }: SecondarySidebarProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <aside className="w-[220px] h-full bg-surface border-e border-surface-border p-4 shrink-0">
      <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
        {t("dashboard")}
      </p>
      {/* Placeholder – module-specific sub-navigation goes here */}
    </aside>
  );
}
