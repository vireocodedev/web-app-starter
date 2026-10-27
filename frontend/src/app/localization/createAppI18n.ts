import { createInstance, type i18n } from "i18next";
import { initReactI18next } from "react-i18next";

import type {} from "./i18next.augmentation";
import { appLocales, defaultAppLocale, type AppLocale } from "./localeConfig";
import { translationResources } from "./localeSetup";

export function resolvedAppLocale(language: string | undefined): AppLocale {
  return appLocales.includes(language as AppLocale) ? (language as AppLocale) : defaultAppLocale;
}

/** Creates an application-owned instance instead of mutating i18next's default singleton. */
export function createAppI18n(initialLocale: AppLocale): i18n {
  const instance = createInstance();

  void instance.use(initReactI18next).init({
    defaultNS: "translation",
    fallbackLng: defaultAppLocale,
    initAsync: false,
    interpolation: { escapeValue: false },
    lng: initialLocale,
    ns: ["translation"],
    react: { useSuspense: false },
    resources: translationResources,
    supportedLngs: appLocales,
  });

  return instance;
}
