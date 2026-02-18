"use client";

import { RentProvider } from "@/modules/rent/rent-context";

export default function RentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RentProvider>{children}</RentProvider>;
}
