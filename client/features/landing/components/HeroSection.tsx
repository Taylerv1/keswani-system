"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/translation";

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

export default function HeroSection() {
  const { t, dir } = useTranslation();

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      dir={dir}
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ background: "#0f172a" }}
    >
      {/* Background image */}
      <Image
        src="/LoginBackgroundV2.png"
        alt=""
        fill
        priority
        className="object-cover opacity-15"
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.6) 60%, rgba(15,23,42,0.85) 100%)",
        }}
      />

      {/* Animated blobs */}
      <div
        className="absolute top-1/4 animate-blob will-change-transform"
        style={{
          [dir === "rtl" ? "left" : "right"]: "10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-1/4 animate-blob-delay will-change-transform"
        style={{
          [dir === "rtl" ? "right" : "left"]: "5%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(123,47,247,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={fadeInUp} className="mb-8">
          <Image
            src="/logoV2.png"
            alt="Kiswani"
            width={120}
            height={120}
            className="mx-auto"
            style={{ filter: "drop-shadow(0 0 40px rgba(245,166,35,0.3))" }}
          />
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeInUp}
          className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-2"
        >
          {t("landingHeroTitle1")}
        </motion.h1>
        <motion.h1
          variants={fadeInUp}
          className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-6"
        >
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-hover), #fbbf24)",
            }}
          >
            {t("landingHeroTitle2")}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeInUp}
          className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {t("landingHeroSubtitle")}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/login"
            className="h-12 px-8 rounded-xl text-sm font-semibold text-white no-underline flex items-center justify-center
              bg-gradient-to-r from-primary to-primary-hover
              hover:shadow-lg hover:shadow-primary/30 hover:brightness-105
              transition-all duration-200 min-w-[180px]"
          >
            {t("landingGetStarted")}
          </Link>
          <button
            onClick={scrollToFeatures}
            className="h-12 px-8 rounded-xl text-sm font-semibold text-white no-underline flex items-center justify-center
              border border-white/20 bg-transparent hover:bg-white/10
              transition-all duration-200 cursor-pointer min-w-[180px]"
          >
            {t("landingHeroLearnMore")}
          </button>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown size={24} className="text-white/40" />
      </motion.div>
    </section>
  );
}
