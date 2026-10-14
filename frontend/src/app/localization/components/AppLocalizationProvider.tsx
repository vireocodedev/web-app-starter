import type { PropsWithChildren } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { I18nextProvider } from "react-i18next";

import { createAppI18n, resolvedAppLocale } from "../createAppI18n";
import type { AppLocale } from "../localeConfig";
import { AppLocalizationContext } from "../contexts/AppLocalizationContext";
import { persistAppLocale } from "../preferences/localePreference";

type AppLocalizationProviderProps = PropsWithChildren<{
  fixedLocale?: AppLocale;
  initialLocale: AppLocale;
}>;

export function AppLocalizationProvider({ children, fixedLocale, initialLocale }: AppLocalizationProviderProps) {
  const [i18n] = useState(() => createAppI18n(fixedLocale ?? initialLocale));
  const [locale, setResolvedLocale] = useState(() => resolvedAppLocale(i18n.resolvedLanguage ?? i18n.language));

  useEffect(() => {
    const synchronizeLocale = (language: string) => {
      setResolvedLocale(resolvedAppLocale(language));
    };

    i18n.on("languageChanged", synchronizeLocale);

    return () => {
      i18n.off("languageChanged", synchronizeLocale);
    };
  }, [i18n]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const previousLanguage = root.getAttribute("lang");
    const previousDirection = root.getAttribute("dir");

    root.lang = locale;
    root.dir = i18n.dir(locale);

    return () => {
      if (previousLanguage === null) root.removeAttribute("lang");
      else root.lang = previousLanguage;
      if (previousDirection === null) root.removeAttribute("dir");
      else root.dir = previousDirection;
    };
  }, [i18n, locale]);

  const setLocale = useCallback(
    (nextLocale: AppLocale) => {
      if (fixedLocale !== undefined) return;

      persistAppLocale(nextLocale);
      void i18n.changeLanguage(nextLocale);
    },
    [fixedLocale, i18n],
  );
  const value = useMemo(() => ({ direction: i18n.dir(locale), locale, setLocale }), [i18n, locale, setLocale]);

  return (
    <I18nextProvider i18n={i18n}>
      <AppLocalizationContext.Provider value={value}>{children}</AppLocalizationContext.Provider>
    </I18nextProvider>
  );
}
