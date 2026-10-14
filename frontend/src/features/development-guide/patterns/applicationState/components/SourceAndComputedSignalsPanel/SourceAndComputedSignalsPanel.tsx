import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

import { WritableSignalsPreview } from "./WritableSignalsPreview";

import { ComputedSignalPreview } from "./ComputedSignalPreview";

import { BatchedActionPreview } from "./BatchedActionPreview";

const sourceSignalsCode = `import { signal } from '@preact/signals-react'

const sigEstimateHours = signal(8)
const sigEstimateHourlyRate = signal(75)

function setEstimateHours(hours: number) {
  sigEstimateHours.value = Math.max(0, hours)
}

<TextField
  onChange={(event) => setEstimateHours(Number(event.target.value))}
  value={sigEstimateHours.value}
/>`;

const computedSignalCode = `import { computed } from '@preact/signals-react'

const { formatCurrency } = useAppLocalizationFormatters()

const sigEstimateTotal = computed(
  () => sigEstimateHours.value * sigEstimateHourlyRate.value,
)

<Typography>{formatCurrency(sigEstimateTotal.value, 'EUR')}</Typography>`;

const batchedActionCode = `import { batch } from '@preact/signals-react'

function applyExampleEstimate() {
  batch(() => {
    sigEstimateHours.value = 12
    sigEstimateHourlyRate.value = 90
  })
}

<Button onClick={applyExampleEstimate}>Apply example estimate</Button>`;

export function SourceAndComputedSignalsPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("applicationStateExamples.source.contents.label"),
      title: t("applicationStateExamples.source.contents.title"),
    },
    examples: [
      {
        code: sourceSignalsCode,
        description: t("applicationStateExamples.source.writable.description"),
        id: "application-state-source-signals",
        sourcePath:
          "src/features/development-guide/patterns/applicationState/components/SourceAndComputedSignalsPanel/WritableSignalsPreview.tsx",
        preview: <WritableSignalsPreview />,
        title: t("applicationStateExamples.source.writable.title"),
      },
      {
        code: computedSignalCode,
        description: t("applicationStateExamples.source.computed.description"),
        id: "application-state-computed-signal",
        sourcePath:
          "src/features/development-guide/patterns/applicationState/components/SourceAndComputedSignalsPanel/ComputedSignalPreview.tsx",
        preview: <ComputedSignalPreview />,
        title: t("applicationStateExamples.source.computed.title"),
      },
      {
        code: batchedActionCode,
        description: t("applicationStateExamples.source.batch.description"),
        id: "application-state-batched-action",
        sourcePath:
          "src/features/development-guide/patterns/applicationState/components/SourceAndComputedSignalsPanel/BatchedActionPreview.tsx",
        preview: <BatchedActionPreview />,
        title: t("applicationStateExamples.source.batch.title"),
      },
    ],
  } satisfies ExampleGalleryResources;
  return <ExampleGallery resources={resources} />;
}
