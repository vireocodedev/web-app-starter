import type { CountryCode } from "@rgo-web/frontend";

import type { AppLocale } from "./localeConfig";

export const appLocalePresentation = {
  en: { countryCode: "GB", shortLabel: "EN" },
  hr: { countryCode: "HR", shortLabel: "HR" },
} as const satisfies Record<AppLocale, Readonly<{ countryCode: CountryCode; shortLabel: string }>>;
