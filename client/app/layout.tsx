"use client";

import "./globals.css";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";

function HtmlShell({ children }: { children: React.ReactNode }) {
  const { locale, dir } = useLanguage();

  return (
    <html lang={locale} dir={dir}>
      <head>
        <title>Keswani System</title>
        <meta name="description" content="Keswani property management system" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      <HtmlShell>{children}</HtmlShell>
    </LanguageProvider>
  );
}
