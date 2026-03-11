"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/translation";
import ProfileHeader from "@/features/profile/components/ProfileHeader";
import ProfileInfoCard from "@/features/profile/components/ProfileInfoCard";
import SecuritySettings from "@/features/profile/components/SecuritySettings";
import ActivityTimeline from "@/features/profile/components/ActivityTimeline";
import PreferencesPanel from "@/features/profile/components/PreferencesPanel";
import EditProfileModal from "@/features/profile/components/EditProfileModal";
import { LoadingLottie, Modal } from "@/components/ui";
import { resetPassword } from "@/features/auth/api/auth";
import { getProfileFromProxy, updateProfileViaProxy } from "@/features/profile/api/profile";
import { UserProfile } from "@/features/profile/types";

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  lastLogin: string;
  status: string;
  role: string;
  twoFactorEnabled: boolean;
}

export default function ProfilePage() {
  const { t } = useTranslation();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [preferences, setPreferences] = useState({
    notificationsEmail: false,
    notificationsSms: false,
    notificationsPush: false,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await getProfileFromProxy();
        const p = response.profile;

        const mapped: ProfileData = {
          fullName: p.full_name ?? "",
          email: p.email ?? "",
          phone: p.phone ?? "",
          address: p.address ?? "",
          createdAt: p.created_at ? new Date(p.created_at as string).toLocaleDateString() : "",
          lastLogin: p.last_login ?? "",
          status: "is_active" in p ? (p.is_active ? "active" : "inactive") : "active",
          role: "role" in p ? (p.role ?? "") : (response.user?.role ?? response.user?.user_type ?? ""),
          twoFactorEnabled: false,
        };

        if (active) setProfile(mapped);
      } catch (error) {
        console.error("Profile load error", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const handleSaveProfile = async (data: Partial<ProfileData>) => {
    try {
      setLoading(true);
      const response = await updateProfileViaProxy({
        full_name: data.fullName,
        phone: data.phone,
        address: data.address,
      });

      const p = response.profile;
      const updatedFullName = typeof p.full_name === "string" ? p.full_name.trim() : "";

      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          fullName: updatedFullName || prev.fullName,
          phone: p.phone || prev.phone,
          address: p.address || prev.address,
        };
      });

      if (updatedFullName && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("profile:name-updated", {
            detail: { fullName: updatedFullName },
          })
        );
      }

      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2500);
    } catch (err) {
      console.error("Error updating profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = (val: boolean) => {
    setProfile((prev) => (prev ? { ...prev, twoFactorEnabled: val } : prev));
  };

  const handleToggleNotifications = (val: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      notificationsEmail: val,
      notificationsSms: val,
      notificationsPush: val,
    }));
  };

  const handleResetPassword = async () => {
    setResetError("");

    if (!resetToken || !resetToken.trim()) {
      setResetError("Reset token is required");
      return;
    }

    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetError("New password must be at least 6 characters");
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError("Passwords do not match");
      return;
    }

    setResetLoading(true);
    try {
      const result = await resetPassword(resetToken, resetNewPassword);
      if (!result.success) {
        setResetError(result.error || "Failed to reset password");
        return;
      }

      setResetSuccess(true);
      setResetToken("");
      setResetNewPassword("");
      setResetConfirmPassword("");
      setTimeout(() => {
        setResetPasswordOpen(false);
        setResetSuccess(false);
      }, 3000);
    } catch (err) {
      setResetError("An error occurred. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Success toast */}
      {toastVisible && (
        <div className="fixed top-6 end-6 z-50 p-4 rounded-xl bg-card-green text-white text-sm font-medium shadow-lg animate-in">
          {t("profileUpdated")}
        </div>
      )}

      {/* Page title */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{t("profileTitle")}</h1>
        <p className="text-text-secondary text-xs sm:text-sm mt-1">{t("profileSubtitle")}</p>
      </div>

      {loading && (
        <div className="min-h-[55vh] flex items-center justify-center mb-6">
          <LoadingLottie size={120} className="p-4" />
        </div>
      )}

      {profile && (
        <>
          {/* Header */}
          <div className="mb-6">
            <ProfileHeader
              fullName={profile.fullName}
              role={profile.role}
              status={profile.status}
              email={profile.email}
              onEdit={() => setEditOpen(true)}
            />
          </div>


          {/* Reset Password Modal (accessible from email reset link) */}
          <Modal
            open={resetPasswordOpen}
            onClose={() => {
              setResetPasswordOpen(false);
              setResetToken("");
              setResetNewPassword("");
              setResetConfirmPassword("");
              setResetError("");
              setResetSuccess(false);
            }}
            title={t("resetPassword")}
            maxWidth="max-w-sm"
          >
            <div className="space-y-4">
              {resetSuccess && (
                <div className="rounded-lg border border-card-green/20 bg-card-green-light px-3 py-2 text-sm text-card-green font-medium">
                  {t("passwordReset")}
                </div>
              )}

              {resetError && (
                <div className="rounded-lg border border-card-red/20 bg-card-red-light px-3 py-2 text-sm text-card-red">
                  {resetError}
                </div>
              )}

              {!resetSuccess && (
                <>
                  <p className="text-sm text-text-secondary">
                    {t("enterResetToken")}
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      {t("resetToken")}
                    </label>
                    <input
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Paste token from email"
                      className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      {t("newPassword")}
                    </label>
                    <input
                      type="password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      {t("confirmPassword")}
                    </label>
                    <input
                      type="password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResetPasswordOpen(false);
                        setResetToken("");
                        setResetNewPassword("");
                        setResetConfirmPassword("");
                        setResetError("");
                      }}
                      className="flex-1 h-10 rounded-lg border border-surface-border bg-surface text-text-secondary text-sm font-medium cursor-pointer hover:bg-background transition-colors"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="button"
                      disabled={resetLoading}
                      onClick={handleResetPassword}
                      className="flex-1 h-10 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white text-sm font-medium cursor-pointer border-0 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {resetLoading ? <LoadingLottie size={24} /> : t("resetPassword")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </Modal>
          {/* Two-column layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Left column */}
            <div className="space-y-6">
              <ProfileInfoCard
                fullName={profile.fullName}
                email={profile.email}
                phone={profile.phone}
                address={profile.address}
                createdAt={profile.createdAt}
              />
              <PreferencesPanel
                notificationsEnabled={preferences.notificationsPush}
                onToggleNotifications={handleToggleNotifications}
              />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <SecuritySettings
                lastLogin={profile.lastLogin}
                accountStatus={profile.status}
                twoFactorEnabled={profile.twoFactorEnabled}
                onToggle2FA={handleToggle2FA}
              />
              <ActivityTimeline items={[]} />
            </div>
          </div>

          {/* Edit Modal */}
          <EditProfileModal
            open={editOpen}
            onClose={() => setEditOpen(false)}
            data={{
              fullName: profile.fullName,
              email: profile.email,
              phone: profile.phone,
              address: profile.address,
            }}
            onSave={(data) => handleSaveProfile({ ...profile, ...data })}
          />
        </>
      )}
    </div>
  );
}
