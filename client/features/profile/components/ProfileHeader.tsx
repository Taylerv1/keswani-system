"use client";

import { Edit2 } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { StatusBadge } from "@/components/ui";

interface ProfileHeaderProps {
  fullName: string;
  role: string;
  status: string;
  email: string;
  onEdit: () => void;
}

export default function ProfileHeader({ fullName, role, status, email, onEdit }: ProfileHeaderProps) {
  const { t } = useTranslation();

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const roleLabel = role === "admin" ? t("roleAdmin") : t("roleOwner");

  return (
    <div className="relative bg-surface rounded-2xl border border-surface-border overflow-hidden">
      {/* Gradient banner */}
      <div className="h-28 sm:h-36 bg-gradient-to-br from-sidebar-bg via-sidebar-bg-dark to-primary/80 relative">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-8 end-12 w-32 h-32 rounded-full bg-primary/15 blur-lg" />
        <div className="absolute top-10 end-40 w-20 h-20 rounded-full bg-primary/10 blur-md" />
      </div>

      {/* Profile content */}
      <div className="relative px-4 sm:px-6 pb-4 sm:pb-6">
        {/* Avatar — overlaps banner */}
        <div className="-mt-10 sm:-mt-14 flex items-end gap-4 sm:gap-5">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg ring-4 ring-surface transition-transform duration-300 group-hover:scale-105">
              {initials}
            </div>
            <div className="absolute -bottom-1 -end-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-card-green border-[3px] border-surface" />
          </div>

          {/* Name + email — visible only on sm+ next to avatar */}
          <div className="hidden sm:block flex-1 min-w-0 pb-1">
            <h1 className="text-2xl font-bold text-text-primary truncate">{fullName}</h1>
            <p className="text-sm text-text-secondary mt-0.5 truncate">{email}</p>
          </div>

          {/* Edit button — visible only on sm+ */}
          <div className="hidden sm:block shrink-0">
            <button
              onClick={onEdit}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer flex items-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 active:scale-[0.97]"
            >
              <Edit2 size={15} />
              {t("editProfile")}
            </button>
          </div>
        </div>

        {/* Mobile: name + email + button stacked below avatar */}
        <div className="sm:hidden mt-3 space-y-3">
          <div>
            <h1 className="text-lg font-bold text-text-primary">{fullName}</h1>
            <p className="text-xs text-text-secondary mt-0.5">{email}</p>
          </div>
          <button
            onClick={onEdit}
            className="h-9 w-full rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white text-xs font-medium cursor-pointer flex items-center justify-center gap-2 border-0 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 active:scale-[0.97]"
          >
            <Edit2 size={15} />
            {t("editProfile")}
          </button>
        </div>
      </div>
    </div>
  );
}
