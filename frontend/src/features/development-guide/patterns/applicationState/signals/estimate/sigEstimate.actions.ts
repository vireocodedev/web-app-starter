import { batch } from "@preact/signals-react";

import { appLocalStorage, appLocalStorageKeys } from "@/app/data/storage/appLocalStorage";

import { defaultEstimate } from "./sigEstimate.model";
import { sigEstimateHourlyRate, sigEstimateHours } from "./sigEstimate";

function normalizeEstimateValue(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function setEstimateHours(hours: number) {
  sigEstimateHours.value = normalizeEstimateValue(hours);
}

export function setEstimateHourlyRate(hourlyRate: number) {
  sigEstimateHourlyRate.value = normalizeEstimateValue(hourlyRate);
}

export function setEstimate(estimate: { hourlyRate: number; hours: number }) {
  batch(() => {
    setEstimateHours(estimate.hours);
    setEstimateHourlyRate(estimate.hourlyRate);
  });
}

export function resetEstimate() {
  batch(() => {
    sigEstimateHours.value = defaultEstimate.hours;
    sigEstimateHourlyRate.value = defaultEstimate.hourlyRate;
  });
}

export function hydrateEstimate() {
  const persistedEstimate = appLocalStorage.get(appLocalStorageKeys.applicationStateExample);

  batch(() => {
    sigEstimateHours.value = persistedEstimate.hours;
    sigEstimateHourlyRate.value = persistedEstimate.hourlyRate;
  });
}
