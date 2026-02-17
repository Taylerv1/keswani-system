"use client";

import { useState, type FormEvent } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "@/lib/translation-context";
import { Globe } from "lucide-react";

export default function LoginPage() {
  const { t, dir, toggleLocale } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Placeholder – no backend logic
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/dashboard/rent";
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex bg-background" dir={dir}>
      {/* Language toggle – floating */}
      <button
        onClick={toggleLocale}
        className="fixed top-4 z-50 flex items-center gap-1.5 h-9 px-3 rounded-lg border border-surface-border
          bg-surface text-text-secondary hover:text-primary hover:border-primary/40
          transition-all duration-200 text-sm cursor-pointer shadow-sm"
        style={{ [dir === "rtl" ? "left" : "right"]: "16px" }}
      >
        <Globe size={16} />
        <span>{t("switchLanguage")}</span>
      </button>

      {/* Left side – decorative gradient panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        {/* Gradient background inspired by login design */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, var(--login-gradient-start) 0%, var(--login-gradient-mid) 50%, var(--login-gradient-end) 100%)",
          }}
        />
        {/* Overlay pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg
            viewBox="0 0 600 600"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="200" cy="150" r="120" fill="rgba(255,255,255,0.1)" />
            <circle cx="400" cy="400" r="180" fill="rgba(255,255,255,0.07)" />
            <circle cx="100" cy="450" r="80" fill="rgba(255,255,255,0.05)" />
          </svg>
        </div>
        {/* Brand text */}
        <div className="relative z-10 text-center text-white px-12">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-bold text-white">K</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">{t("appName")}</h1>
          <p className="text-white/80 text-lg leading-relaxed">
            {t("welcome")}
          </p>
        </div>
      </div>

      {/* Right side – form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-text-primary text-center mb-2">
            {t("signIn")}
          </h2>
          <p className="text-text-secondary text-center mb-8 text-sm">
            {t("signInSubtitle")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="relative">
              <Mail
                size={18}
                className="absolute top-1/2 -translate-y-1/2 text-text-muted"
                style={{ [dir === "rtl" ? "right" : "left"]: "14px" }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("email")}
                required
                className="w-full h-12 rounded-lg border border-surface-border bg-surface text-text-primary
                  placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30
                  focus:border-primary transition-all text-sm"
                style={{
                  [dir === "rtl" ? "paddingRight" : "paddingLeft"]: "44px",
                  [dir === "rtl" ? "paddingLeft" : "paddingRight"]: "14px",
                }}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock
                size={18}
                className="absolute top-1/2 -translate-y-1/2 text-text-muted"
                style={{ [dir === "rtl" ? "right" : "left"]: "14px" }}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("password")}
                required
                className="w-full h-12 rounded-lg border border-surface-border bg-surface text-text-primary
                  placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30
                  focus:border-primary transition-all text-sm"
                style={{
                  [dir === "rtl" ? "paddingRight" : "paddingLeft"]: "44px",
                  [dir === "rtl" ? "paddingLeft" : "paddingRight"]: "44px",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer bg-transparent border-0"
                style={{ [dir === "rtl" ? "left" : "right"]: "14px" }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-surface-border accent-primary cursor-pointer"
              />
              <span className="text-sm text-text-secondary">
                {t("rememberMe")}
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg font-semibold text-sm tracking-wide text-white
                bg-gradient-to-r from-primary to-primary-hover
                hover:shadow-lg hover:shadow-primary/30
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-200 cursor-pointer border-0 uppercase"
            >
              {loading ? t("loading") : t("signInButton")}
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center mt-6 text-sm text-text-secondary">
            {t("noAccount")}{" "}
            <span className="text-primary font-semibold cursor-pointer hover:underline">
              {t("signUp")}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
