import { createContext } from "react";

import type { AppLocale } from "../localeConfig";

export type AppLocalizationContextValue = {
  direction: "ltr" | "rtl";
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

export const AppLocalizationContext = createContext<AppLocalizationContextValue | null>(null);
