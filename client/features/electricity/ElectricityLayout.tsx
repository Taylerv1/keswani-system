"use client";

import { ElectricityProvider } from "@/features/electricity/context/electricity-context";

export default function ElectricityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ElectricityProvider>{children}</ElectricityProvider>;
}
