import type { AppLocale } from "../localeConfig";
import type { DevelopmentGuideTranslationShape } from "../types/TranslationShape";
import { englishDevelopmentGuideTranslations } from "./development-guide.en";
import { croatianDevelopmentGuideTranslations } from "./development-guide.hr";

/** Development-only translations live behind a separate resource entry point. */
export const developmentGuideTranslationResources = {
  en: { "development-guide": englishDevelopmentGuideTranslations },
  hr: { "development-guide": croatianDevelopmentGuideTranslations },
} as const satisfies Record<AppLocale, { "development-guide": DevelopmentGuideTranslationShape }>;
