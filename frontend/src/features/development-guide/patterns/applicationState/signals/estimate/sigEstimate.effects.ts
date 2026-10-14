import { effect } from "@preact/signals-react";
import type { SignalEffectsModule } from "@rgo-web/frontend";

import { appLocalStorage, appLocalStorageKeys } from "@/app/data/storage/appLocalStorage";

import { hydrateEstimate } from "./sigEstimate.actions";
import { sigEstimateHourlyRate, sigEstimateHours, sigEstimatePersistenceStatus } from "./sigEstimate";

export function initEstimateSignalEffects(): () => void {
  return effect(() => {
    const estimate = {
      hourlyRate: sigEstimateHourlyRate.value,
      hours: sigEstimateHours.value,
    };

    try {
      appLocalStorage.set(appLocalStorageKeys.applicationStateExample, estimate);
      sigEstimatePersistenceStatus.value = "saved";
    } catch {
      sigEstimatePersistenceStatus.value = "unavailable";
    }
  });
}

export const applicationStateSignalModule = {
  hydrate: hydrateEstimate,
  initEffects: initEstimateSignalEffects,
} satisfies SignalEffectsModule;
