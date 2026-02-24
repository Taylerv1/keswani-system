"use client";

import { useEffect, useState } from "react";
import { Lock, Clock, ShieldCheck, KeyRound } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { StatusBadge, Modal } from "@/components/ui";

interface SecuritySettingsProps {
  lastLogin: string;
  accountStatus: string;
  twoFactorEnabled: boolean;
  onToggle2FA: (val: boolean) => void;
}

export default function SecuritySettings({
  lastLogin,
  accountStatus,
  twoFactorEnabled,
  onToggle2FA,
}: SecuritySettingsProps) {
  const { t } = useTranslation();
  const [passwordModal, setPasswordModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (iso: string) => {
    if (!mounted || !iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  };

  const handlePasswordSave = async () => {
    setError(null);

    // Basic validations
    if (!currentPassword) {
      setError("Current password is required");
      return;
    }
    if (!newPassword) {
      setError("New password is required");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to change password");
        return;
      }

      setPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError("An error occurred while changing password");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-surface-border p-4 sm:p-6">
      <h2 className="text-base font-semibold text-text-primary mb-4 sm:mb-5">{t("securitySettings")}</h2>

      {saved && (
        <div className="mb-4 p-3 rounded-xl bg-card-green-light text-card-green text-sm font-medium animate-in">
          {t("passwordChanged")}
        </div>
      )}

      <div className="space-y-4">
        {/* Change Password */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-xl bg-background hover:bg-primary-light/30 transition-colors duration-200 group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-card-orange-light text-card-orange flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
              <Lock size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{t("changePassword")}</p>
            </div>
          </div>
          <button
            onClick={() => setPasswordModal(true)}
            className="h-9 px-4 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:text-primary hover:border-primary/40 transition-colors w-full sm:w-auto"
          >
            {t("changePassword")}
          </button>
        </div>

        {/* Last Login */}
        <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-background">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-card-blue-light text-card-blue flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary">{t("lastLogin")}</p>
            <p className="text-xs text-text-muted mt-0.5 truncate">{formatDate(lastLogin)}</p>
          </div>
        </div>

        {/* 2FA Toggle
        <div className="flex items-center justify-between p-4 rounded-xl bg-background hover:bg-primary-light/30 transition-colors duration-200 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-card-red-light text-card-red flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
              <KeyRound size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{t("twoFactorAuth")}</p>
              <p className="text-xs text-text-muted mt-0.5">{t("twoFactorDesc")}</p>
            </div>
          </div>
          <button
            onClick={() => onToggle2FA(!twoFactorEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer border-0 ${twoFactorEnabled ? "bg-card-green" : "bg-text-muted/40"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${twoFactorEnabled ? "end-0.5" : "start-0.5"}`} />
          </button>
        </div> */}
      </div>

      {/* Change Password Modal */}
      <Modal open={passwordModal} onClose={() => setPasswordModal(false)} title={t("changePassword")} maxWidth="max-w-sm">
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("currentPassword")}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("newPassword")}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t("confirmPassword")}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setPasswordModal(false)}
              disabled={loading}
              className="h-10 px-5 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handlePasswordSave}
              disabled={loading}
              className="h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("saving") : t("save")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
