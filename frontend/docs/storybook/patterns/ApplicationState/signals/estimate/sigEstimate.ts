import { computed, signal } from "@preact/signals-react";

import { defaultEstimate, type EstimatePersistenceStatus } from "./sigEstimate.model";

export const sigEstimateHours = signal<number>(defaultEstimate.hours);
export const sigEstimateHourlyRate = signal<number>(defaultEstimate.hourlyRate);
export const sigEstimatePersistenceStatus = signal<EstimatePersistenceStatus>("idle");

export const sigEstimateTotal = computed(() => sigEstimateHours.value * sigEstimateHourlyRate.value);
