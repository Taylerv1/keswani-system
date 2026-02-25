"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadingLottie } from "@/components/ui";
import { useTranslation } from "@/lib/translation";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Parse access_token from URL fragment (#access_token=...&...)
    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      if (hash.startsWith("#")) {
        const params = new URLSearchParams(hash.substring(1));
        const a = params.get("access_token");
        if (a) setToken(a);
      }
      // Also check query param fallback
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get("access_token");
      if (q) setToken(q);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(t("resetTokenMissing") || "Reset token missing");
      return;
    }
    if (!password || password.length < 6) {
      setError(t("passwordTooShort") || "Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError(t("passwordsMustMatch") || "Passwords must match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setSuccess(true);
      // Optionally redirect to login after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow">
        <h1 className="text-lg font-semibold mb-4">{t("resetPassword") || "Reset password"}</h1>

        {success ? (
          <div className="space-y-4">
            <div className="p-3 rounded bg-card-green-light text-card-green">{t("passwordReset") || "Password reset successfully"}</div>
            <p className="text-sm text-text-secondary">{t("redirectingToLogin") || "Redirecting to login..."}</p>
            <Link href="/login" className="text-primary underline">{t("goToLogin") || "Go to login"}</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-sm text-red-600">{error}</div>}

            <div>
              <label className="block text-sm text-text-secondary mb-1">{t("resetToken") || "Reset token"}</label>
              <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste token" className="w-full h-10 rounded border px-3" />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">{t("newPassword") || "New password"}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-10 rounded border px-3" />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">{t("confirmPassword") || "Confirm password"}</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full h-10 rounded border px-3" />
            </div>

            <div className="flex items-center justify-between gap-3">
              <button type="submit" disabled={loading} className="flex-1 h-10 rounded bg-gradient-to-r from-primary to-primary-hover text-white">
                {loading ? <LoadingLottie size={20} /> : t("resetPassword") || "Reset password"}
              </button>
              <Link href="/login" className="text-sm text-text-secondary">{t("backToLogin") || "Back to login"}</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
