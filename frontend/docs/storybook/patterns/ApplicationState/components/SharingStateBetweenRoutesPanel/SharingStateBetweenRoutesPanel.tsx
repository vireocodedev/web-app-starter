import { ExampleGallery, type ExampleGalleryResources } from "../../../shared/gallery";

import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

import { SharedSurfacePreview } from "./SharedSurfacePreview";

import { ActionBoundaryPreview } from "./ActionBoundaryPreview";

import { RouteTransitionPreview } from "./RouteTransitionPreview";

const sharedSurfaceCode = `function EstimateSummary() {
  const { formatCurrency } = useAppLocalizationFormatters()

  return (
    <Typography>
      {formatCurrency(sigEstimateTotal.value, 'EUR')}
    </Typography>
  )
}`;

const actionBoundaryCode = `import { batch } from '@preact/signals-react'

function resetEstimate() {
  batch(() => {
    sigEstimateHours.value = defaultEstimate.hours
    sigEstimateHourlyRate.value = defaultEstimate.hourlyRate
  })
}

<Button onClick={resetEstimate}>Reset estimate</Button>`;

const routeTransitionCode = `<Button
  component={RouterLink}
  to="/dev-guide/frontend/patterns/application-state/persistent-state"
>
  Review persistence
</Button>`;

export function SharingStateBetweenRoutesPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("applicationStateExamples.sharing.contents.label"),
      title: t("applicationStateExamples.sharing.contents.title"),
    },
    examples: [
      {
        code: sharedSurfaceCode,
        description: t("applicationStateExamples.sharing.surface.description"),
        id: "application-state-shared-surface",
        sourcePath:
          "docs/storybook/patterns/ApplicationState/components/SharingStateBetweenRoutesPanel/SharedSurfacePreview.tsx",
        preview: <SharedSurfacePreview />,
        title: t("applicationStateExamples.sharing.surface.title"),
      },
      {
        code: actionBoundaryCode,
        description: t("applicationStateExamples.sharing.actions.description"),
        id: "application-state-action-boundary",
        sourcePath:
          "docs/storybook/patterns/ApplicationState/components/SharingStateBetweenRoutesPanel/ActionBoundaryPreview.tsx",
        preview: <ActionBoundaryPreview />,
        title: t("applicationStateExamples.sharing.actions.title"),
      },
      {
        code: routeTransitionCode,
        description: t("applicationStateExamples.sharing.transition.description"),
        id: "application-state-real-route-transition",
        sourcePath:
          "docs/storybook/patterns/ApplicationState/components/SharingStateBetweenRoutesPanel/RouteTransitionPreview.tsx",
        preview: <RouteTransitionPreview />,
        title: t("applicationStateExamples.sharing.transition.title"),
      },
    ],
  } satisfies ExampleGalleryResources;
  return <ExampleGallery resources={resources} />;
}
