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

/* Inline SVG hexagon for decorative floating shapes */
function Hexagon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon
        points="50,2 93,25 93,75 50,98 7,75 7,25"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

export default function FeaturesSection() {
  const { t, dir } = useTranslation();

  return (
    <section id="features" dir={dir} className="relative py-20 sm:py-28 overflow-hidden">
      {/* ===== Animated Background Layer ===== */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Moving gradient base */}
        <div
          className="absolute inset-0 animate-gradient-bg"
          style={{
            background:
              "linear-gradient(135deg, #f4f6f9 0%, #fef9f0 25%, #f4f6f9 50%, #f0f4fe 75%, #f4f6f9 100%)",
          }}
        />

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(245,166,35,0.35) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Sweeping light beam */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute top-0 -left-1/2 w-[200%] h-[120px] animate-light-sweep opacity-40"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(245,166,35,0.08) 40%, rgba(245,166,35,0.15) 50%, rgba(245,166,35,0.08) 60%, transparent 100%)",
            }}
          />
        </div>

        {/* Floating hexagons (matching logo motif) */}
        <Hexagon
          className="absolute w-16 h-16 text-primary/[0.09] animate-hex-1"
          style={{ top: "12%", right: "8%" }}
        />
        <Hexagon
          className="absolute w-10 h-10 text-card-blue/[0.08] animate-hex-2"
          style={{ bottom: "18%", left: "5%" }}
        />
        <Hexagon
          className="absolute w-12 h-12 text-primary/[0.06] animate-hex-3"
          style={{ top: "55%", right: "15%" }}
        />
        <Hexagon
          className="absolute w-8 h-8 text-card-green/[0.07] animate-hex-1"
          style={{ top: "8%", left: "18%" }}
        />

        {/* Orbiting small dots */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: 0, height: 0 }}
        >
          <div className="animate-orbit">
            <div className="w-2 h-2 rounded-full bg-primary/15" />
          </div>
        </div>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: 0, height: 0 }}
        >
          <div className="animate-orbit-reverse">
            <div className="w-1.5 h-1.5 rounded-full bg-card-blue/10" />
          </div>
        </div>

        {/* Soft glow spots (different from orbs — these are stationary but pulse) */}
        <div
          className="absolute w-[350px] h-[350px] rounded-full animate-mesh-1 will-change-transform"
          style={{
            top: "-5%",
            right: "-5%",
            background: "radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full animate-mesh-3 will-change-transform"
          style={{
            bottom: "0%",
            left: "-3%",
            background: "radial-gradient(circle, rgba(30,136,229,0.06) 0%, transparent 65%)",
          }}
        />
      </div>

      {/* ===== Content ===== */}
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
                className="bg-white/80 backdrop-blur-sm rounded-2xl border border-surface-border p-8
                  hover:shadow-lg hover:bg-white transition-all duration-300 cursor-default"
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
