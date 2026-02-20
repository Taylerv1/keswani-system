import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./(pages)/globals.css";
import { TranslationProvider } from "@/lib/translation-context";
import { AuthProvider } from "@/providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Keswani System",
  description: "Keswani Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TranslationProvider>
          <AuthProvider>{children}</AuthProvider>
        </TranslationProvider>
      </body>
    </html>
  );
}
