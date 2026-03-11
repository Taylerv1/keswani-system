"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "@/lib/translation";

export default function CTASection() {
  const { t, dir } = useTranslation();

  return (
    <section dir={dir} className="py-20 sm:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative rounded-3xl px-8 py-16 sm:px-12 sm:py-20 text-center overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #1a1a2e 0%, #16213e 35%, #0f172a 70%, #1a1a2e 100%)",
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Animated gold gradient overlay */}
          <div
            className="absolute inset-0 opacity-20 animate-mesh-1"
            style={{
              background:
                "radial-gradient(ellipse at 20% 50%, rgba(245,166,35,0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(230,149,26,0.3) 0%, transparent 60%)",
            }}
          />

          {/* Decorative circles with gold tint */}
          <div className="absolute top-6 left-8 w-20 h-20 rounded-full border border-primary/15 animate-float-slow" />
          <div className="absolute bottom-8 right-12 w-14 h-14 rounded-full border border-primary/15 animate-float-med" />
          <div className="absolute top-1/2 right-1/4 w-8 h-8 rounded-full bg-primary/[0.07] animate-blob" />

          {/* Content */}
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
              {t("landingCTATitle")}
            </h2>
            <p className="text-white/70 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
              {t("landingCTASubtitle")}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-14 px-10 rounded-xl
                bg-gradient-to-r from-primary to-primary-hover text-white text-base font-semibold no-underline
                hover:scale-105 transition-all duration-200
                shadow-lg shadow-primary/25 animate-glow-pulse"
            >
              {t("landingCTAButton")}
            </Link>
            <p className="text-white/40 text-sm mt-4">{t("landingCTANote")}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
