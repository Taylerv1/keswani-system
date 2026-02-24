"use client";

import { useState, type FormEvent } from "react";
import { Mail, Lock, Eye, EyeOff, Globe } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "@/lib/translation";
import { LoadingLottie } from "@/components/ui";

export default function LoginPage() {
  const { t, dir, toggleLocale } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, remember_me: remember }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      // Login successful - cookies are set automatically
      const userData = result.data.user;

      // Log reminder status for debugging
      if (remember) {
        console.log("✓ Session saved for 30-90 days (remember me enabled)");
      } else {
        console.log("✓ Session saved for 7-30 days (standard expiry)");
      }

      // Redirect based on user type
      if (userData.user_type === "employee") {
        window.location.href = "/admin-dashboard/rent";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center" dir={dir}>
      {/* Background image */}
      <Image
        src="/LoginBackgroundV2.png"
        alt=""
        fill
        priority
        className="object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px]" />

      {/* Language toggle – floating */}
      <button
        onClick={toggleLocale}
        className="fixed top-5 z-50 flex items-center gap-1.5 h-9 px-3.5 rounded-full
          bg-white/10 backdrop-blur-md text-white/90 hover:bg-white/20
          border border-white/20 transition-all duration-200 text-sm cursor-pointer"
        style={{ [dir === "rtl" ? "left" : "right"]: "20px" }}
      >
        <Globe size={15} />
        <span>{t("switchLanguage")}</span>
      </button>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-[440px] mx-4">
        <div className="bg-white rounded-2xl shadow-2xl px-8 py-10 sm:px-10 sm:py-12">

          {/* Title */}
          <h1 className="text-[22px] font-bold text-text-primary text-center mb-1">
            {t("signIn")}
          </h1>
          <p className="text-text-secondary text-center mb-8 text-[13px]">
            {t("signInSubtitle")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {t("email")}
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute top-1/2 -translate-y-1/2 text-text-muted"
                  style={{ [dir === "rtl" ? "right" : "left"]: "12px" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("email")}
                  required
                  className="w-full h-11 rounded-lg border border-surface-border bg-surface text-text-primary text-sm
                    placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/25
                    focus:border-primary transition-all"
                  style={{
                    [dir === "rtl" ? "paddingRight" : "paddingLeft"]: "40px",
                    [dir === "rtl" ? "paddingLeft" : "paddingRight"]: "14px",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {t("password")}
              </label>
              <div className="relative">
                <Lock
                  size={17}
                  className="absolute top-1/2 -translate-y-1/2 text-text-muted"
                  style={{ [dir === "rtl" ? "right" : "left"]: "12px" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("password")}
                  required
                  className="w-full h-11 rounded-lg border border-surface-border bg-surface text-text-primary text-sm
                    placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/25
                    focus:border-primary transition-all"
                  style={{
                    [dir === "rtl" ? "paddingRight" : "paddingLeft"]: "40px",
                    [dir === "rtl" ? "paddingLeft" : "paddingRight"]: "40px",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary
                    transition-colors cursor-pointer bg-transparent border-0 p-0"
                  style={{ [dir === "rtl" ? "left" : "right"]: "12px" }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2 cursor-pointer select-none pt-0.5">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-surface-border accent-primary cursor-pointer"
              />
              <span className="text-[13px] text-text-secondary">
                {t("rememberMe")}
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg font-semibold text-sm tracking-wide text-white
                bg-gradient-to-r from-primary to-primary-hover
                hover:shadow-lg hover:shadow-primary/30 hover:brightness-105
                active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-200 cursor-pointer border-0 uppercase flex items-center justify-center"
            >
              {loading ? <LoadingLottie size={28} /> : t("signInButton")}
            </button>
          </form>

          {/* OR divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              {t("orDivider")}
            </span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          {/* Google login button */}
          <button
            type="button"
            className="w-full h-11 rounded-lg border border-surface-border bg-surface text-text-primary
              hover:bg-gray-50 hover:border-gray-300
              flex items-center justify-center gap-3 text-sm font-medium
              transition-all duration-200 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t("continueWithGoogle")}
          </button>
        </div>
      </div>
    </div>
  );
}
