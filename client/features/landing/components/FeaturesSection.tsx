"use client";

import { motion } from "framer-motion";
import { Building2, Zap, UserCircle, CreditCard, Wrench, BarChart3 } from "lucide-react";
import { useTranslation } from "@/lib/translation";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const features = [
  {
    icon: Building2,
    titleKey: "landingFeatureRentTitle",
    descKey: "landingFeatureRentDesc",
    bgColor: "bg-card-blue-light",
    iconColor: "text-card-blue",
  },
  {
    icon: Zap,
    titleKey: "landingFeatureElecTitle",
    descKey: "landingFeatureElecDesc",
    bgColor: "bg-card-orange-light",
    iconColor: "text-card-orange",
  },
  {
    icon: UserCircle,
    titleKey: "landingFeatureTenantTitle",
    descKey: "landingFeatureTenantDesc",
    bgColor: "bg-card-green-light",
    iconColor: "text-card-green",
  },
  {
    icon: CreditCard,
    titleKey: "landingFeaturePaymentTitle",
    descKey: "landingFeaturePaymentDesc",
    bgColor: "bg-card-blue-light",
    iconColor: "text-card-blue",
  },
  {
    icon: Wrench,
    titleKey: "landingFeatureMaintenanceTitle",
    descKey: "landingFeatureMaintenanceDesc",
    bgColor: "bg-card-red-light",
    iconColor: "text-card-red",
  },
  {
    icon: BarChart3,
    titleKey: "landingFeatureReportsTitle",
    descKey: "landingFeatureReportsDesc",
    bgColor: "bg-card-orange-light",
    iconColor: "text-card-orange",
  },
] as const;

export default function FeaturesSection() {
  const { t, dir } = useTranslation();

  return (
    <section id="features" dir={dir} className="relative py-20 sm:py-28 bg-background overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute w-[500px] h-[500px] rounded-full animate-mesh-1 will-change-transform"
          style={{
            top: "-10%",
            right: "-8%",
            background: "radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full animate-mesh-2 will-change-transform"
          style={{
            bottom: "-5%",
            left: "-6%",
            background: "radial-gradient(circle, rgba(30,136,229,0.05) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full animate-mesh-3 will-change-transform"
          style={{
            top: "40%",
            left: "50%",
            background: "radial-gradient(circle, rgba(245,166,35,0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.h2
            variants={fadeInUp}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary mb-4"
          >
            {t("landingFeaturesTitle")}
          </motion.h2>
          <motion.div
            variants={fadeInUp}
            className="w-12 h-[3px] bg-primary rounded-full mx-auto mb-4"
          />
          <motion.p
            variants={fadeInUp}
            className="text-text-secondary max-w-xl mx-auto text-base"
          >
            {t("landingFeaturesSubtitle")}
          </motion.p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.titleKey}
                variants={fadeInUp}
                whileHover={{ y: -4 }}
                className="bg-surface rounded-2xl border border-surface-border p-8
                  hover:shadow-lg transition-shadow duration-300 cursor-default"
              >
                <div
                  className={`w-14 h-14 rounded-xl ${feature.bgColor} ${feature.iconColor}
                    flex items-center justify-center mb-5`}
                >
                  <Icon size={26} />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t(feature.descKey)}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
