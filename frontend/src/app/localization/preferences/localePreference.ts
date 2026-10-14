import { appLocalStorage, appLocalStorageKeys } from "@/app/data/storage/appLocalStorage";

import { defaultAppLocale, isAppLocale, type AppLocale } from "../localeConfig";

function supportedLocale(value: string | undefined): AppLocale | undefined {
  const language = value?.toLowerCase().split("-")[0];

  return isAppLocale(language) ? language : undefined;
}

function readStoredLocale(): AppLocale | undefined {
  return supportedLocale(appLocalStorage.get(appLocalStorageKeys.locale) ?? undefined);
}

function preferredBrowserLocale(): AppLocale | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }

  const browserLanguages = navigator.languages.length > 0 ? navigator.languages : [navigator.language];

  return browserLanguages
    .map(language => supportedLocale(language))
    .find((locale): locale is AppLocale => locale !== undefined);
}

/**
 * Resolves an initial application locale without mutating browser state.
 *
 * An explicit stored preference wins; browser preferences are only a fallback.
 */
export function resolveInitialLocale(): AppLocale {
  return readStoredLocale() ?? preferredBrowserLocale() ?? defaultAppLocale;
}

/** Persists only a language chosen explicitly by the user. */
export function persistAppLocale(locale: AppLocale) {
  try {
    appLocalStorage.set(appLocalStorageKeys.locale, locale);
  } catch {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }
}
