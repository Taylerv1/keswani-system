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
    <section dir={dir} className="relative py-20 sm:py-28 bg-background overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute w-[450px] h-[450px] rounded-full animate-mesh-2 will-change-transform"
          style={{
            top: "-8%",
            left: "-5%",
            background: "radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute w-[350px] h-[350px] rounded-full animate-mesh-3 will-change-transform"
          style={{
            bottom: "-10%",
            right: "-4%",
            background: "radial-gradient(circle, rgba(67,160,71,0.05) 0%, transparent 70%)",
          }}
        />
      </div>

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
                <div className="relative z-10 w-16 h-16 rounded-full border-2 border-primary bg-surface flex items-center justify-center mx-auto mb-6 shadow-md">
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
