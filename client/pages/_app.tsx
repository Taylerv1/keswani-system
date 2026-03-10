import type { AppProps } from "next/app";
import { TranslationProvider } from "@/lib/translation";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <TranslationProvider>
      <Component {...pageProps} />
    </TranslationProvider>
  );
}
