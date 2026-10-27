import { ExampleGallery, type ExampleGalleryResources } from "../../../shared/gallery";

import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

import { StorageContractPreview } from "./StorageContractPreview";

import { HydrationPreview } from "./HydrationPreview";

import { PersistenceEffectPreview } from "./PersistenceEffectPreview";
import estimateStorageSource from "../../signals/estimate/estimateStorage.ts?raw";
import estimateEffectsSource from "../../signals/estimate/sigEstimate.effects.ts?raw";

// Source comes from the same private adapter and effect used by this preview.
const storageContractCode = estimateStorageSource;

const hydrationCode = `import { batch } from '@preact/signals-react'
import { estimateStorage } from '../../signals/estimate/estimateStorage'
import { sigEstimateHours, sigEstimateHourlyRate } from '../../signals/estimate/sigEstimate'

export function hydrateEstimate() {
  const persistedEstimate = estimateStorage.read()

  batch(() => {
    sigEstimateHours.value = persistedEstimate.hours
    sigEstimateHourlyRate.value = persistedEstimate.hourlyRate
  })
}`;

const persistenceEffectCode = estimateEffectsSource;

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
          "docs/storybook/patterns/ApplicationState/components/PersistentStatePanel/StorageContractPreview.tsx",
        preview: <StorageContractPreview />,
        title: t("applicationStateExamples.persistence.contract.title"),
      },
      {
        code: hydrationCode,
        description: t("applicationStateExamples.persistence.hydration.description"),
        id: "application-state-hydration",
        sourcePath: "docs/storybook/patterns/ApplicationState/components/PersistentStatePanel/HydrationPreview.tsx",
        preview: <HydrationPreview />,
        title: t("applicationStateExamples.persistence.hydration.title"),
      },
      {
        code: persistenceEffectCode,
        description: t("applicationStateExamples.persistence.effect.description"),
        id: "application-state-persistence-effect",
        sourcePath:
          "docs/storybook/patterns/ApplicationState/components/PersistentStatePanel/PersistenceEffectPreview.tsx",
        preview: <PersistenceEffectPreview />,
        title: t("applicationStateExamples.persistence.effect.title"),
      },
    ],
  } satisfies ExampleGalleryResources;
  return <ExampleGallery resources={resources} />;
}
