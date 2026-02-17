"use client";

import { useTranslation } from "@/lib/translation-context";

export default function RentPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">
        {t("rent")}
      </h1>
      <p className="text-text-secondary text-sm">
        {/* Placeholder for rent module */}
      </p>
    </div>
  );
}
