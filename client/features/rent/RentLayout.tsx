"use client";

import { RentProvider } from "@/features/rent/context/rent-context";

export default function RentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RentProvider>{children}</RentProvider>;
}
