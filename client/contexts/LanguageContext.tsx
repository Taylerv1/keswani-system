"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import en from "@/translations/en";
import ar from "@/translations/ar";
import type { Translations } from "@/translations/en";

type Locale = "en" | "ar";

interface LanguageContextValue {
    locale: Locale;
    dir: "ltr" | "rtl";
    t: Translations;
    setLocale: (locale: Locale) => void;
    toggleLocale: () => void;
}

const translations: Record<Locale, Translations> = { en, ar };

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("en");

    const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";
    const t = translations[locale];

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
    }, []);

    const toggleLocale = useCallback(() => {
        setLocaleState((prev) => (prev === "en" ? "ar" : "en"));
    }, []);

    const value = useMemo(
        () => ({ locale, dir, t, setLocale, toggleLocale }),
        [locale, dir, t, setLocale, toggleLocale]
    );

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage(): LanguageContextValue {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
