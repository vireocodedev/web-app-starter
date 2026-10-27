import "i18next";
import type { englishTranslations } from "./translations/translation.en";

export type BaseAppTranslation = typeof englishTranslations;
// Consumer documentation may extend these open resource interfaces outside production source.
// This named interface intentionally supports declaration merging in separate consumers.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AppTranslationResource extends BaseAppTranslation {}
export interface AppTranslationResources {
  translation: AppTranslationResource;
}

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: AppTranslationResources;
    strictKeyChecks: true;
  }
}
