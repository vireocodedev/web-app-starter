import { ExampleGallery, type ExampleGalleryResources } from "../../../shared/gallery";

import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

import { ApplicationEffectPreview } from "./ApplicationEffectPreview";

import { ComponentEffectPreview } from "./ComponentEffectPreview";

import { NonReactiveReadPreview } from "./NonReactiveReadPreview";
import estimateEffectsSource from "../../signals/estimate/sigEstimate.effects.ts?raw";

// Show the actual preview implementation, including ownership and failure state.
const applicationEffectCode = estimateEffectsSource;

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
          "docs/storybook/patterns/ApplicationState/components/EffectsAndCleanupPanel/ApplicationEffectPreview.tsx",
        preview: <ApplicationEffectPreview />,
        title: t("applicationStateExamples.effects.application.title"),
      },
      {
        code: componentEffectCode,
        description: t("applicationStateExamples.effects.component.description"),
        id: "application-state-component-effect",
        sourcePath:
          "docs/storybook/patterns/ApplicationState/components/EffectsAndCleanupPanel/ComponentEffectPreview.tsx",
        preview: <ComponentEffectPreview />,
        title: t("applicationStateExamples.effects.component.title"),
      },
      {
        code: nonReactiveCode,
        description: t("applicationStateExamples.effects.nonReactive.description"),
        id: "application-state-non-reactive-read",
        sourcePath:
          "docs/storybook/patterns/ApplicationState/components/EffectsAndCleanupPanel/NonReactiveReadPreview.tsx",
        preview: <NonReactiveReadPreview />,
        title: t("applicationStateExamples.effects.nonReactive.title"),
      },
    ],
  } satisfies ExampleGalleryResources;
  return <ExampleGallery resources={resources} />;
}
