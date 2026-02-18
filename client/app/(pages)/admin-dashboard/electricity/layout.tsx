"use client";

import { ElectricityProvider } from "@/modules/electricity/electricity-context";

export default function ElectricityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ElectricityProvider>{children}</ElectricityProvider>;
}
