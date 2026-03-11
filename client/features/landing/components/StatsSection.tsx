"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Building2, Zap, CreditCard, Shield } from "lucide-react";
import { useTranslation } from "@/lib/translation";
import { useCountUp } from "../hooks/useCountUp";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

interface StatItemProps {
  target: number;
  suffix: string;
  labelKey: string;
  icon: React.ElementType;
  started: boolean;
  decimal?: boolean;
}

function StatItem({ target, suffix, labelKey, icon: Icon, started, decimal }: StatItemProps) {
  const { t } = useTranslation();
  const value = useCountUp(decimal ? target * 10 : target, 2000, started);
  const display = decimal ? (value / 10).toFixed(1) : value.toLocaleString();

  return (
    <motion.div variants={fadeInUp} className="text-center">
      <div className="flex justify-center mb-3">
        <Icon size={28} className="text-primary/60" />
      </div>
      <div
        className="text-4xl lg:text-5xl font-bold mb-2 bg-clip-text text-transparent"
        style={{
          backgroundImage: "linear-gradient(135deg, var(--primary), #fbbf24)",
        }}
      >
        {display}
        {suffix}
      </div>
      <div className="text-sm text-slate-400">{t(labelKey)}</div>
    </motion.div>
  );
}

const stats = [
  { target: 500, suffix: "+", labelKey: "landingStatsProperties" as const, icon: Building2 },
  { target: 1200, suffix: "+", labelKey: "landingStatsSubscribers" as const, icon: Zap },
  { target: 50, suffix: "K+", labelKey: "landingStatsPayments" as const, icon: CreditCard },
  { target: 99.9, suffix: "%", labelKey: "landingStatsUptime" as const, icon: Shield, decimal: true },
];

export default function StatsSection() {
  const { dir } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section dir={dir} className="py-20 sm:py-24" style={{ background: "#0f172a" }}>
      <motion.div
        ref={ref}
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {stats.map((stat) => (
          <StatItem
            key={stat.labelKey}
            target={stat.target}
            suffix={stat.suffix}
            labelKey={stat.labelKey}
            icon={stat.icon}
            started={isInView}
            decimal={stat.decimal}
          />
        ))}
      </motion.div>
    </section>
  );
}
