"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/translation";
import { LoadingLottie, Modal } from "@/components/ui";
import { resetPassword } from "@/features/auth/api/auth";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Support both legacy hash tokens and query tokens/error params.
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const search = typeof window !== "undefined" ? window.location.search : "";
    const hashParams = new URLSearchParams(hash.substring(1)); // Remove '#'
    const searchParams = new URLSearchParams(search);
    const flowType = hashParams.get("type") || searchParams.get("type");

    // Backward compatibility: old invite links might still point to /reset-password.
    if (flowType === "invite") {
      router.replace(`/accept-invite${search}${hash}`);
      return;
    }

    const token =
      hashParams.get("access_token") || searchParams.get("access_token");

    if (token) {
      setAccessToken(token);
      setResetModalOpen(true);
    } else {
      const errorDescription =
        searchParams.get("error_description") || searchParams.get("error");
      if (errorDescription) {
        setResetError(decodeURIComponent(errorDescription));
      }
      // No token found, redirect to login
      setTimeout(() => router.replace("/login"), 2000);
    }
  }, [router]);

  const handleResetPassword = async () => {
    setResetError("");

    if (!newPassword || newPassword.length < 6) {
      setResetError(t("passwordMinLength"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError(t("passwordsDoNotMatch"));
      return;
    }

    setResetLoading(true);
    try {
      const result = await resetPassword(accessToken, newPassword);
      if (!result.success) {
        setResetError(result.error || "Failed to reset password");
        return;
      }

      setResetSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        router.replace("/login");
      }, 3000);
    } catch {
      setResetError(t("genericTryAgain"));
    } finally {
      setResetLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingLottie size={64} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary-hover/10 flex items-center justify-center p-4">
      {accessToken ? (
        <Modal
          open={resetModalOpen}
          onClose={() => {
            setResetModalOpen(false);
            router.replace("/login");
          }}
          title={t("resetPassword")}
          maxWidth="max-w-sm"
        >
          <div className="space-y-4">
            {resetSuccess && (
              <div className="rounded-lg border border-card-green/20 bg-card-green-light px-3 py-2 text-sm text-card-green font-medium">
                {t("passwordReset")} {t("redirectingLogin")}
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
                  {t("enterNewPassword")}
                </p>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t("newPassword")}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("newPassword")}
                    className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t("confirmPassword")}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("confirmPassword")}
                    className="w-full h-10 rounded-lg border border-surface-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetModalOpen(false);
                      router.replace("/login");
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
      ) : (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {t("invalidResetLink")}
          </h1>
          {resetError && (
            <p className="text-card-red text-sm mb-2">{resetError}</p>
          )}
          <p className="text-text-secondary mb-6">{t("redirectingLogin")}</p>
          <button
            onClick={() => router.replace("/login")}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-primary to-primary-hover text-white font-medium cursor-pointer hover:shadow-lg transition-all"
          >
            {t("backToLogin")}
          </button>
        </div>
      )}
    </div>
  );
}
