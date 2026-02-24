"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/translation";
import ProfileHeader from "@/features/profile/components/ProfileHeader";
import ProfileInfoCard from "@/features/profile/components/ProfileInfoCard";
import SecuritySettings from "@/features/profile/components/SecuritySettings";
import ActivityTimeline from "@/features/profile/components/ActivityTimeline";
import PreferencesPanel from "@/features/profile/components/PreferencesPanel";
import EditProfileModal from "@/features/profile/components/EditProfileModal";

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

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/me", { method: "GET", cache: "no-store" });
        const json = await res.json();

        if (!json?.success || !json?.data?.profile) {
          throw new Error(json?.error || "Failed to load profile");
        }

        const p = json.data.profile as any;
        const mapped: ProfileData = {
          fullName: p.full_name ?? "",
          email: p.email ?? "",
          phone: p.phone ?? "",
          address: p.address ?? "",
          createdAt: p.created_at ? new Date(p.created_at as string).toLocaleDateString() : "",
          lastLogin: p.last_login ?? "",
          status: p.is_active ? "active" : "inactive",
          role: json.data.user?.role ?? json.data.user?.user_type ?? "",
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
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: data.fullName,
          phone: data.phone,
          address: data.address,
        }),
      });

      const json = await res.json();

      if (json.success && json.data?.profile) {
        const p = json.data.profile;
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
      } else {
        console.error("Failed to update profile", json.error);
      }
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

      {loading && <div className="text-sm text-text-secondary">{t("loading")}</div>}

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
