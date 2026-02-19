// Not-Found Page
// Simplified to avoid hydration errors (nested html/body tags).
// Should inherit layout from the nearest parent or default.

import "./(pages)/globals.css"; // Import styles directly
import NotFoundContent from "@/app/_components/NotFoundContent";
import { TranslationProvider } from "@/lib/translation-context";

export default function NotFound() {
  return (
    <TranslationProvider>
      <NotFoundContent />
    </TranslationProvider>
  );
}
