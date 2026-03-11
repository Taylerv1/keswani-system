"use client";

import Link from "next/link";
import { MoveLeft, MoveRight } from "lucide-react";
import { useTranslation } from "@/lib/translation";

export default function NotFoundContent() {
  const { t, dir } = useTranslation();

  const ArrowIcon = dir === "rtl" ? MoveRight : MoveLeft;

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background"
      dir={dir}
    >
      {/* ── Animated background blobs ── */}
      <div
        className="animate-blob pointer-events-none select-none absolute -top-32 -start-32 w-[480px] h-[480px] rounded-full opacity-[0.08]"
        style={{
          background:
            "radial-gradient(circle, var(--login-gradient-start), transparent 70%)",
        }}
      />
      <div
        className="animate-blob-delay pointer-events-none select-none absolute -bottom-40 -end-32 w-[520px] h-[520px] rounded-full opacity-[0.07]"
        style={{
          background:
            "radial-gradient(circle, var(--login-gradient-end), transparent 70%)",
        }}
      />
      <div
        className="animate-blob pointer-events-none select-none absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
        style={{
          background:
            "radial-gradient(circle, var(--login-gradient-mid), transparent 70%)",
          animationDelay: "4s",
        }}
      />

      {/* ── Decorative spinning ring ── */}
      <div
        className="animate-spin-slow pointer-events-none select-none absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-dashed opacity-[0.06]"
        style={{ borderColor: "var(--primary)" }}
      />

      {/* ── Main card ── */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-6 text-center">

        {/* 404 number */}
        <div className="relative mb-2 animate-fade-in">
          {/* Pulse ring behind the number */}
          <span
            className="animate-pulse-ring absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            aria-hidden
          >
            <span
              className="block w-60 h-24 rounded-full opacity-40"
              style={{ background: "var(--primary-light)" }}
            />
          </span>

          <h1
            className="animate-float-slow relative inline-block text-[9rem] sm:text-[11rem] font-black leading-none tracking-tighter select-none"
            style={{
              background:
                "linear-gradient(135deg, var(--orange-gradient-start, #FF9800) 0%, var(--orange-gradient-mid, #FFC107) 50%, var(--orange-gradient-end, #FF5722) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 8px 24px rgba(255,152,0,0.18))",
            }}
          >
            {t("notFoundCode")}
          </h1>
        </div>

        {/* Divider */}
        <div
          className="animate-fade-in delay-100 mx-auto mb-8 h-1 w-20 rounded-full opacity-70"
          style={{
            background:
              "linear-gradient(90deg, var(--orange-gradient-start, #FF9800), var(--orange-gradient-mid, #FFC107), var(--orange-gradient-end, #ffa68a))",
          }}
        />

        {/* Title */}
        <h2 className="animate-fade-in-up delay-200 text-2xl sm:text-3xl font-bold text-text-primary mb-3">
          {t("notFoundTitle")}
        </h2>

        {/* Description */}
        <p className="animate-fade-in-up delay-300 text-text-secondary text-base leading-relaxed mb-10 max-w-sm mx-auto">
          {t("notFoundDescription")}
        </p>

        {/* Action buttons */}
        <div className="animate-fade-in-up delay-400 flex flex-col sm:flex-row items-center justify-center gap-3">

          {/* Secondary — home */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-12 px-7 rounded-xl font-semibold text-sm
              border border-surface-border bg-surface text-text-secondary
              hover:text-primary hover:border-primary/40 hover:bg-primary-light
              transition-all duration-200"
          >
            <ArrowIcon size={18} />
            <span>{t("notFoundBackHome")}</span>
          </Link>
        </div>

        {/* Footer hint */}
        <p className="animate-fade-in delay-500 mt-12 text-xs text-text-muted">
          {t("appName")} &mdash; {t("notFoundCode")}
        </p>
      </div>
    </div>
  );
}
