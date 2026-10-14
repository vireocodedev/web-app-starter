import type { englishDevelopmentGuideTranslations } from "../translations/development-guide.en";
import type { englishTranslations } from "../translations/translation.en";

export type StringLeaves<Value> = Value extends string ? string : { [Key in keyof Value]: StringLeaves<Value[Key]> };

export type TranslationShape = StringLeaves<typeof englishTranslations>;

export type DevelopmentGuideTranslationShape = StringLeaves<typeof englishDevelopmentGuideTranslations>;
