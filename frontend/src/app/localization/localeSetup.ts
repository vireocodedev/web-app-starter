import { enUS, hrHR, type Localization } from "@mui/material/locale";

import { englishTranslations } from "./translations/translation.en";
import { croatianTranslations } from "./translations/translation.hr";
import type { AppLocale } from "./localeConfig";
import type { TranslationShape } from "./types/TranslationShape";

/** MUI's core component text follows the application's active locale. */
export const muiLocaleOptions = {
  en: enUS,
  hr: hrHR,
} as const satisfies Record<AppLocale, Localization>;

/** Application-owned translations are registered in every build. */
export const translationResources = {
  en: { translation: englishTranslations },
  hr: { translation: croatianTranslations },
} as const satisfies Record<AppLocale, { translation: TranslationShape }>;
