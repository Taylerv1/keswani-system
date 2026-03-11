"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslation } from "@/lib/translation";

export default function Footer() {
  const { t, dir } = useTranslation();

  const columns = [
    {
      titleKey: "landingFooterPlatform" as const,
      links: [
        { key: "landingFooterFeatures" as const, href: "#features" },
        { key: "landingFooterHowItWorks" as const, href: "#workflow" },
      ],
    },
    {
      titleKey: "landingFooterSupport" as const,
      links: [
        { key: "landingFooterContact" as const, href: "#" },
        { key: "landingFooterDocs" as const, href: "#" },
      ],
    },
    {
      titleKey: "landingFooterLegal" as const,
      links: [
        { key: "landingFooterPrivacy" as const, href: "#" },
        { key: "landingFooterTerms" as const, href: "#" },
      ],
    },
  ];

  return (
    <footer dir={dir} style={{ background: "#0f172a" }}>
      <motion.div
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {/* Top */}
        <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Image
                src="/CloseSidebarLogo.png"
                alt="Kiswani"
                width={36}
                height={36}
                className="object-contain"
              />
              <span className="text-lg font-bold text-primary tracking-wide">KISWANI</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t("landingFooterTagline")}
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.titleKey}>
              <h4 className="text-sm font-semibold text-white mb-4">
                {t(col.titleKey)}
              </h4>
              <ul className="space-y-2.5 list-none p-0 m-0">
                {col.links.map((link) => (
                  <li key={link.key}>
                    <a
                      href={link.href}
                      className="text-slate-400 text-sm no-underline hover:text-primary transition-colors"
                    >
                      {t(link.key)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="py-5 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} {t("landingFooterCopyright")}
          </p>
        </div>
      </motion.div>
    </footer>
  );
}
