import { ExampleGallery, type ExampleGalleryResources } from "../../../shared/gallery";

import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

import { GroupedDecimalPreview } from "./GroupedDecimalPreview";

import { PercentagePreview } from "./PercentagePreview";

import { CurrencyPreview } from "./CurrencyPreview";

const numberCode = `const { formatNumber } = useAppLocalizationFormatters()

formatNumber(1284500.75, {
  maximumFractionDigits: 2,
})`;

const percentageCode = `const { formatPercentage } = useAppLocalizationFormatters()
const completionRatio = 0.72

formatPercentage(completionRatio, {
  maximumFractionDigits: 0,
})`;

const currencyCode = `const { formatCurrency } = useAppLocalizationFormatters()

formatCurrency(18450.5, 'EUR')`;

export function NumbersPercentagesAndCurrenciesPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("localizationExamples.numbers.contents.label"),
      title: t("localizationExamples.numbers.contents.title"),
    },
    examples: [
      {
        code: numberCode,
        description: t("localizationExamples.numbers.decimal.description"),
        id: "localization-grouped-decimal",
        sourcePath:
          "docs/storybook/patterns/Localization/components/NumbersPercentagesAndCurrenciesPanel/GroupedDecimalPreview.tsx",
        preview: <GroupedDecimalPreview />,
        title: t("localizationExamples.numbers.decimal.title"),
      },
      {
        code: percentageCode,
        description: t("localizationExamples.numbers.percentage.description"),
        id: "localization-percentage",
        sourcePath:
          "docs/storybook/patterns/Localization/components/NumbersPercentagesAndCurrenciesPanel/PercentagePreview.tsx",
        preview: <PercentagePreview />,
        title: t("localizationExamples.numbers.percentage.title"),
      },
      {
        code: currencyCode,
        description: t("localizationExamples.numbers.currency.description"),
        id: "localization-currency",
        sourcePath:
          "docs/storybook/patterns/Localization/components/NumbersPercentagesAndCurrenciesPanel/CurrencyPreview.tsx",
        preview: <CurrencyPreview />,
        title: t("localizationExamples.numbers.currency.title"),
      },
    ],
  } satisfies ExampleGalleryResources;
  return <ExampleGallery resources={resources} />;
}
