import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

import { ApplicationEffectPreview } from "./ApplicationEffectPreview";

import { ComponentEffectPreview } from "./ComponentEffectPreview";

import { NonReactiveReadPreview } from "./NonReactiveReadPreview";

const applicationEffectCode = `import { effect } from '@preact/signals-react'

function initEstimateSignalEffects() {
  return effect(() => {
    appLocalStorage.set(appLocalStorageKeys.applicationStateExample, {
      hourlyRate: sigEstimateHourlyRate.value,
      hours: sigEstimateHours.value,
    })
  })
}`;

const componentEffectCode = `const { formatCurrency } = useAppLocalizationFormatters()
const total = sigEstimateTotal.value

React.useEffect(() => {
  const previousTitle = document.title
  document.title = formatCurrency(total, 'EUR')

  return () => {
    document.title = previousTitle
  }
}, [formatCurrency, total])`;

const nonReactiveCode = `function recordSubmittedTotal() {
  analytics.track('estimate-submitted', {
    total: sigEstimateTotal.peek(),
  })
}`;

export function EffectsAndCleanupPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("applicationStateExamples.effects.contents.label"),
      title: t("applicationStateExamples.effects.contents.title"),
    },
    examples: [
      {
        code: applicationEffectCode,
        description: t("applicationStateExamples.effects.application.description"),
        id: "application-state-application-effect",
        sourcePath:
          "src/features/development-guide/patterns/applicationState/components/EffectsAndCleanupPanel/ApplicationEffectPreview.tsx",
        preview: <ApplicationEffectPreview />,
        title: t("applicationStateExamples.effects.application.title"),
      },
      {
        code: componentEffectCode,
        description: t("applicationStateExamples.effects.component.description"),
        id: "application-state-component-effect",
        sourcePath:
          "src/features/development-guide/patterns/applicationState/components/EffectsAndCleanupPanel/ComponentEffectPreview.tsx",
        preview: <ComponentEffectPreview />,
        title: t("applicationStateExamples.effects.component.title"),
      },
      {
        code: nonReactiveCode,
        description: t("applicationStateExamples.effects.nonReactive.description"),
        id: "application-state-non-reactive-read",
        sourcePath:
          "src/features/development-guide/patterns/applicationState/components/EffectsAndCleanupPanel/NonReactiveReadPreview.tsx",
        preview: <NonReactiveReadPreview />,
        title: t("applicationStateExamples.effects.nonReactive.title"),
      },
    ],
  } satisfies ExampleGalleryResources;
  return <ExampleGallery resources={resources} />;
}
