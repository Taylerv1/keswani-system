import en from "./en";
import ar from "./ar";

export type Locale = "en" | "ar";

const translations: Record<Locale, Record<string, string>> = {
  en,
  ar,
};

export function getTranslation(locale: Locale, key: string): string {
  return translations[locale]?.[key] ?? key;
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export { en, ar };
export default translations;
