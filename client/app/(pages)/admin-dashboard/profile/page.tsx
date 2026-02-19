"use client";

import { useState, useEffect } from "react";
import { Building2, Users, Zap } from "lucide-react";
import { useTranslation } from "@/lib/translation-context";
import { KpiCard } from "@/components/ui";
import ProfileHeader from "@/modules/profile/components/ProfileHeader";
import ProfileInfoCard from "@/modules/profile/components/ProfileInfoCard";
import SecuritySettings from "@/modules/profile/components/SecuritySettings";
import ActivityTimeline from "@/modules/profile/components/ActivityTimeline";
import PreferencesPanel from "@/modules/profile/components/PreferencesPanel";
import EditProfileModal from "@/modules/profile/components/EditProfileModal";
import mockData from "@/mocks/profile.mock.json";

export default function ProfilePage() {
  const { t } = useTranslation();

  const [user, setUser] = useState(mockData.user);
  const [preferences, setPreferences] = useState(mockData.preferences);
  const [editOpen, setEditOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const handleSaveProfile = (data: {
    firstName: string;
    firstNameAr: string;
    lastName: string;
    lastNameAr: string;
    email: string;
    phone: string;
    address: string;
    addressAr: string;
  }) => {
    setUser((prev) => ({ ...prev, ...data }));
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const handleToggle2FA = (val: boolean) => {
    setUser((prev) => ({ ...prev, twoFactorEnabled: val }));
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t("profileTitle")}</h1>
        <p className="text-text-secondary text-sm mt-1">{t("profileSubtitle")}</p>
      </div>

      {/* Header */}
      <div className="mb-6">
        <ProfileHeader
          firstName={user.firstName}
          firstNameAr={user.firstNameAr}
          lastName={user.lastName}
          lastNameAr={user.lastNameAr}
          role={user.role}
          status={user.status}
          email={user.email}
          onEdit={() => setEditOpen(true)}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left column */}
        <div className="space-y-6">
          <ProfileInfoCard
            firstName={user.firstName}
            firstNameAr={user.firstNameAr}
            lastName={user.lastName}
            lastNameAr={user.lastNameAr}
            email={user.email}
            phone={user.phone}
            address={user.address}
            addressAr={user.addressAr}
            language={user.language}
            createdAt={user.createdAt}
          />
          <PreferencesPanel
            notificationsEnabled={preferences.notificationsPush}
            onToggleNotifications={handleToggleNotifications}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <SecuritySettings
            lastLogin={user.lastLogin}
            accountStatus={user.status}
            twoFactorEnabled={user.twoFactorEnabled}
            onToggle2FA={handleToggle2FA}
          />
          <ActivityTimeline items={mockData.activity.timeline} />
        </div>
      </div>

      {/* Edit Modal */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        data={{
          firstName: user.firstName,
          firstNameAr: user.firstNameAr,
          lastName: user.lastName,
          lastNameAr: user.lastNameAr,
          email: user.email,
          phone: user.phone,
          address: user.address,
          addressAr: user.addressAr,
        }}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
