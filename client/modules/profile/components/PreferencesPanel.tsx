"use client";

import { Globe, Palette, Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
import { useTranslation } from "@/lib/translation-context";

interface PreferencesPanelProps {
  notificationsEmail: boolean;
  notificationsSms: boolean;
  notificationsPush: boolean;
  onToggleNotification: (key: "email" | "sms" | "push", val: boolean) => void;
}

export default function PreferencesPanel({
  notificationsEmail,
  notificationsSms,
  notificationsPush,
  onToggleNotification,
}: PreferencesPanelProps) {
  const { t, locale, toggleLocale } = useTranslation();

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer border-0 ${checked ? "bg-card-green" : "bg-text-muted/40"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${checked ? "end-0.5" : "start-0.5"}`} />
    </button>
  );

  return (
    <div className="bg-surface rounded-2xl border border-surface-border p-6">
      <h2 className="text-base font-semibold text-text-primary mb-5">{t("preferencesTitle")}</h2>
      <div className="space-y-4">
        {/* Language */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-background hover:bg-primary-light/30 transition-colors duration-200 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-card-blue-light text-card-blue flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
              <Globe size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{t("languageSwitch")}</p>
              <p className="text-xs text-text-muted mt-0.5">{locale === "ar" ? "العربية" : "English"}</p>
            </div>
          </div>
          <button
            onClick={toggleLocale}
            className="h-9 px-4 rounded-lg border border-surface-border bg-surface text-sm font-medium text-text-secondary cursor-pointer hover:text-primary hover:border-primary/40 transition-colors"
          >
            {t("switchLanguage")}
          </button>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-background group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-card-orange-light text-card-orange flex items-center justify-center">
              <Palette size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{t("themePreview")}</p>
              <p className="text-xs text-text-muted mt-0.5">{t("themePreviewDesc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-lg bg-primary-light text-primary font-medium">{t("lightTheme")}</span>
            <span className="text-[10px] text-text-muted bg-surface border border-surface-border rounded-md px-2 py-1">{t("comingSoon")}</span>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-4 rounded-xl bg-background space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-card-green-light text-card-green flex items-center justify-center">
              <Bell size={18} />
            </div>
            <p className="text-sm font-medium text-text-primary">{t("notifications")}</p>
          </div>

          <div className="space-y-3 ms-[52px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-text-muted" />
                <span className="text-sm text-text-secondary">{t("emailNotifications")}</span>
              </div>
              <Toggle checked={notificationsEmail} onChange={() => onToggleNotification("email", !notificationsEmail)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-text-muted" />
                <span className="text-sm text-text-secondary">{t("smsNotifications")}</span>
              </div>
              <Toggle checked={notificationsSms} onChange={() => onToggleNotification("sms", !notificationsSms)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone size={14} className="text-text-muted" />
                <span className="text-sm text-text-secondary">{t("pushNotifications")}</span>
              </div>
              <Toggle checked={notificationsPush} onChange={() => onToggleNotification("push", !notificationsPush)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
