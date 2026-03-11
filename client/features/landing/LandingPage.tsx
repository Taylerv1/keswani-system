"use client";

import dynamic from "next/dynamic";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";

const FeaturesSection = dynamic(() => import("./components/FeaturesSection"), { ssr: false });
const StatsSection = dynamic(() => import("./components/StatsSection"), { ssr: false });
const WorkflowSection = dynamic(() => import("./components/WorkflowSection"), { ssr: false });
const CTASection = dynamic(() => import("./components/CTASection"), { ssr: false });
const Footer = dynamic(() => import("./components/Footer"), { ssr: false });

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <WorkflowSection />
      <CTASection />
      <Footer />
    </main>
  );
}
