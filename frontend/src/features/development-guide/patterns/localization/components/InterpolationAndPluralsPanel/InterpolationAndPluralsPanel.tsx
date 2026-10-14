import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

import { NamedInterpolationPreview } from "./NamedInterpolationPreview";

import { CardinalPluralsPreview } from "./CardinalPluralsPreview";

import { MultipleValuesPreview } from "./MultipleValuesPreview";

const interpolationCode = `const { t } = useDevelopmentGuideTranslation()
const [name, setName] = React.useState('Marta')

<Typography>
  {t('localizationExamples.interpolation.named.message', { name })}
</Typography>`;

const pluralCode = `const { t } = useDevelopmentGuideTranslation()
const [count, setCount] = React.useState(1)

<Typography>
  {t('localizationExamples.interpolation.plural.message', { count })}
</Typography>`;

const multipleValuesCode = `const { t } = useDevelopmentGuideTranslation()

<Typography>
  {t('localizationExamples.interpolation.multiple.message', {
    actor: 'Marta',
    project: 'Harbor renewal',
  })}
</Typography>`;

export function InterpolationAndPluralsPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("localizationExamples.interpolation.contents.label"),
      title: t("localizationExamples.interpolation.contents.title"),
    },
    examples: [
      {
        code: interpolationCode,
        description: t("localizationExamples.interpolation.named.description"),
        id: "localization-named-interpolation",
        sourcePath:
          "src/features/development-guide/patterns/localization/components/InterpolationAndPluralsPanel/NamedInterpolationPreview.tsx",
        preview: <NamedInterpolationPreview />,
        title: t("localizationExamples.interpolation.named.title"),
      },
      {
        code: pluralCode,
        description: t("localizationExamples.interpolation.plural.description"),
        id: "localization-cardinal-plurals",
        sourcePath:
          "src/features/development-guide/patterns/localization/components/InterpolationAndPluralsPanel/CardinalPluralsPreview.tsx",
        preview: <CardinalPluralsPreview />,
        title: t("localizationExamples.interpolation.plural.title"),
      },
      {
        code: multipleValuesCode,
        description: t("localizationExamples.interpolation.multiple.description"),
        id: "localization-multiple-values",
        sourcePath:
          "src/features/development-guide/patterns/localization/components/InterpolationAndPluralsPanel/MultipleValuesPreview.tsx",
        preview: <MultipleValuesPreview />,
        title: t("localizationExamples.interpolation.multiple.title"),
      },
    ],
  } satisfies ExampleGalleryResources;
  return <ExampleGallery resources={resources} />;
}
