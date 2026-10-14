export const appLocales = ["en", "hr"] as const satisfies readonly string[];

export type AppLocale = (typeof appLocales)[number];

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return appLocales.some(locale => locale === value);
}

export const defaultAppLocale: AppLocale = "en";

export const defaultAppTimeZone = "Europe/Zagreb";
