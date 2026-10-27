import "i18next";
import "@/app/localization/i18next.augmentation";

import type { englishDevelopmentGuideTranslations } from "./development-guide.en";

declare module "@/app/localization/i18next.augmentation" {
  interface AppTranslationResource {
    storybook: {
      headerTabs: typeof englishDevelopmentGuideTranslations.headerTabs;
      navigation: typeof englishDevelopmentGuideTranslations.storyNavigation;
    };
  }
  interface AppTranslationResources {
    "development-guide": typeof englishDevelopmentGuideTranslations;
  }
}
