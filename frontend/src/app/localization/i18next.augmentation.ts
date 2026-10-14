import "i18next";

import type { englishDevelopmentGuideTranslations } from "./translations/development-guide.en";
import type { englishTranslations } from "./translations/translation.en";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof englishTranslations;
      "development-guide": typeof englishDevelopmentGuideTranslations;
    };
    strictKeyChecks: true;
  }
}
