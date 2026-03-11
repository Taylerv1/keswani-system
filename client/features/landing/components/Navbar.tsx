"use client";

import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/translation";

export default function Navbar() {
  const { t, dir, toggleLocale } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      dir={dir}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <Image
            src="/CloseSidebarLogo.png"
            alt="Kiswani"
            width={36}
            height={36}
            className="object-contain"
          />
          <span
            className={`text-lg font-bold tracking-wide transition-colors duration-300 ${
              scrolled ? "text-primary" : "text-white"
            }`}
          >
            KISWANI
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={toggleLocale}
            className={`flex items-center gap-1.5 h-9 px-3.5 rounded-full border transition-all duration-200 text-sm cursor-pointer ${
              scrolled
                ? "bg-gray-100 text-text-secondary border-surface-border hover:bg-gray-200"
                : "bg-white/10 backdrop-blur-md text-white/90 border-white/20 hover:bg-white/20"
            }`}
          >
            <Globe size={15} />
            <span>{t("switchLanguage")}</span>
          </button>

          {/* Sign In button */}
          <Link
            href="/login"
            className={`h-9 px-5 rounded-full text-sm font-semibold no-underline flex items-center transition-all duration-200 ${
              scrolled
                ? "bg-gradient-to-r from-primary to-primary-hover text-white hover:shadow-lg hover:shadow-primary/30"
                : "bg-white text-text-primary hover:bg-white/90"
            }`}
          >
            {t("landingSignIn")}
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
