import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

import { StorageContractPreview } from "./StorageContractPreview";

import { HydrationPreview } from "./HydrationPreview";

import { PersistenceEffectPreview } from "./PersistenceEffectPreview";

const storageContractCode = `import { z } from 'zod'

const appLocalStorageKeys = {
  applicationStateExample: 'rgo.app.application-state-example',
} as const

const appLocalStorageDefaultValues = {
  [appLocalStorageKeys.applicationStateExample]: { hourlyRate: 75, hours: 8 },
}

const appLocalStorageSchema = z.object({
  [appLocalStorageKeys.applicationStateExample]: z.object({
    hourlyRate: z.number().finite().nonnegative(),
    hours: z.number().finite().nonnegative(),
  }),
})`;

const hydrationCode = `import { batch } from '@preact/signals-react'

function hydrateEstimate() {
  const persisted = appLocalStorage.get(
    appLocalStorageKeys.applicationStateExample,
  )

  batch(() => {
    sigEstimateHours.value = persisted.hours
    sigEstimateHourlyRate.value = persisted.hourlyRate
  })
}`;

const persistenceEffectCode = `import { effect } from '@preact/signals-react'

const applicationStateSignalModule = {
  hydrate: hydrateEstimate,
  initEffects: () =>
    effect(() => {
      appLocalStorage.set(appLocalStorageKeys.applicationStateExample, {
        hourlyRate: sigEstimateHourlyRate.value,
        hours: sigEstimateHours.value,
      })
    }),
}`;

export function PersistentStatePanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("applicationStateExamples.persistence.contents.label"),
      title: t("applicationStateExamples.persistence.contents.title"),
    },
    examples: [
      {
        code: storageContractCode,
        description: t("applicationStateExamples.persistence.contract.description"),
        id: "application-state-storage-contract",
        sourcePath:
          "src/features/development-guide/patterns/applicationState/components/PersistentStatePanel/StorageContractPreview.tsx",
        preview: <StorageContractPreview />,
        title: t("applicationStateExamples.persistence.contract.title"),
      },
      {
        code: hydrationCode,
        description: t("applicationStateExamples.persistence.hydration.description"),
        id: "application-state-hydration",
        sourcePath:
          "src/features/development-guide/patterns/applicationState/components/PersistentStatePanel/HydrationPreview.tsx",
        preview: <HydrationPreview />,
        title: t("applicationStateExamples.persistence.hydration.title"),
      },
      {
        code: persistenceEffectCode,
        description: t("applicationStateExamples.persistence.effect.description"),
        id: "application-state-persistence-effect",
        sourcePath:
          "src/features/development-guide/patterns/applicationState/components/PersistentStatePanel/PersistenceEffectPreview.tsx",
        preview: <PersistenceEffectPreview />,
        title: t("applicationStateExamples.persistence.effect.title"),
      },
    ],
  } satisfies ExampleGalleryResources;
  return <ExampleGallery resources={resources} />;
}
