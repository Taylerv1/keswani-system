"use client";

import { motion } from "framer-motion";
import { Building, Activity, TrendingUp } from "lucide-react";
import { useTranslation } from "@/lib/translation";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const steps = [
  {
    num: "01",
    titleKey: "landingWorkflowStep1Title" as const,
    descKey: "landingWorkflowStep1Desc" as const,
    icon: Building,
  },
  {
    num: "02",
    titleKey: "landingWorkflowStep2Title" as const,
    descKey: "landingWorkflowStep2Desc" as const,
    icon: Activity,
  },
  {
    num: "03",
    titleKey: "landingWorkflowStep3Title" as const,
    descKey: "landingWorkflowStep3Desc" as const,
    icon: TrendingUp,
  },
];

export default function WorkflowSection() {
  const { t, dir } = useTranslation();

  return (
    <section dir={dir} className="relative py-20 sm:py-28 overflow-hidden">
      {/* ===== Animated Background Layer ===== */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Moving gradient mesh — different palette than Features */}
        <div
          className="absolute inset-0 animate-gradient-bg"
          style={{
            background:
              "linear-gradient(120deg, #f4f6f9 0%, #f9f4ee 20%, #f4f6f9 40%, #eef4f9 60%, #f4f6f9 80%, #fdf6ee 100%)",
          }}
        />

        {/* Subtle cross-hatch lines pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(45deg, var(--primary) 1px, transparent 1px),
              linear-gradient(-45deg, var(--primary) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Sweeping light beam (reverse direction from Features) */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute bottom-0 -left-1/2 w-[200%] h-[100px] animate-light-sweep-reverse opacity-30"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(230,149,26,0.06) 35%, rgba(245,166,35,0.14) 50%, rgba(230,149,26,0.06) 65%, transparent 100%)",
            }}
          />
        </div>

        {/* Floating geometric shapes — circles + diamonds (different from hex in Features) */}
        <div
          className="absolute w-5 h-5 border-2 border-primary/10 animate-hex-2 will-change-transform"
          style={{ top: "15%", left: "10%", borderRadius: "2px", transform: "rotate(45deg)" }}
        />
        <div
          className="absolute w-3 h-3 bg-primary/10 rounded-full animate-hex-1 will-change-transform"
          style={{ top: "25%", right: "12%" }}
        />
        <div
          className="absolute w-6 h-6 border-2 border-card-blue/[0.08] animate-hex-3 will-change-transform"
          style={{ bottom: "20%", right: "8%", borderRadius: "2px", transform: "rotate(45deg)" }}
        />
        <div
          className="absolute w-4 h-4 bg-card-green/[0.08] rounded-full animate-hex-2 will-change-transform"
          style={{ bottom: "25%", left: "15%" }}
        />
        <div
          className="absolute w-2.5 h-2.5 bg-primary/[0.12] rounded-full animate-hex-3 will-change-transform"
          style={{ top: "60%", left: "45%" }}
        />

        {/* Large soft gradient blobs */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full animate-mesh-2 will-change-transform"
          style={{
            top: "-15%",
            left: "-10%",
            background: "radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full animate-mesh-1 will-change-transform"
          style={{
            bottom: "-10%",
            right: "-8%",
            background: "radial-gradient(circle, rgba(30,136,229,0.05) 0%, transparent 60%)",
          }}
        />

        {/* Thin animated ring */}
        <div
          className="absolute w-[250px] h-[250px] rounded-full border border-primary/[0.05] animate-spin-slow"
          style={{ top: "10%", right: "20%" }}
        />
      </div>

      {/* ===== Content ===== */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.h2
            variants={fadeInUp}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary mb-4"
          >
            {t("landingWorkflowTitle")}
          </motion.h2>
          <motion.div
            variants={fadeInUp}
            className="w-12 h-[3px] bg-primary rounded-full mx-auto mb-4"
          />
          <motion.p variants={fadeInUp} className="text-text-secondary text-base max-w-lg mx-auto">
            {t("landingWorkflowSubtitle")}
          </motion.p>
        </motion.div>

        {/* Steps */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 relative"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Connector line (desktop only) */}
          <div className="hidden lg:block absolute top-14 left-[20%] right-[20%] h-[2px] border-t-2 border-dashed border-primary/25" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                variants={fadeInUp}
                className="relative text-center px-4"
              >
                {/* Watermark number */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 text-7xl sm:text-8xl font-black text-primary/[0.06] select-none pointer-events-none leading-none">
                  {step.num}
                </div>

                {/* Icon circle */}
                <div className="relative z-10 w-16 h-16 rounded-full border-2 border-primary bg-white/80 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 shadow-md">
                  <Icon size={26} className="text-primary" />
                </div>

                {/* Text */}
                <h3 className="text-xl font-semibold text-text-primary mb-3">
                  {t(step.titleKey)}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">
                  {t(step.descKey)}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
