import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { appLocalStorage, appLocalStorageKeys } from "@/app/data/storage/appLocalStorage";
import {
  hydrateEstimate,
  resetEstimate,
  setEstimateHourlyRate,
  setEstimateHours,
} from "@/features/development-guide/patterns/applicationState/signals/estimate/sigEstimate.actions";
import { initEstimateSignalEffects } from "@/features/development-guide/patterns/applicationState/signals/estimate/sigEstimate.effects";
import {
  sigEstimateTotal,
  sigEstimateHourlyRate,
  sigEstimateHours,
  sigEstimatePersistenceStatus,
} from "@/features/development-guide/patterns/applicationState/signals/estimate/sigEstimate";

const defaultPersistedEstimate = { hourlyRate: 75, hours: 8 };

beforeEach(() => {
  resetEstimate();
  sigEstimatePersistenceStatus.value = "idle";
  appLocalStorage.set(appLocalStorageKeys.applicationStateExample, defaultPersistedEstimate);
});

afterEach(() => {
  resetEstimate();
  appLocalStorage.set(appLocalStorageKeys.applicationStateExample, defaultPersistedEstimate);
});

describe("application state example Signal group", () => {
  it("derives the estimate total from normalized source values", () => {
    setEstimateHours(12);
    setEstimateHourlyRate(90);

    expect(sigEstimateHours.value).toBe(12);
    expect(sigEstimateHourlyRate.value).toBe(90);
    expect(sigEstimateTotal.value).toBe(1080);

    setEstimateHours(-4);
    expect(sigEstimateHours.value).toBe(0);
  });

  it("hydrates both source Signals from the typed storage value", () => {
    appLocalStorage.set(appLocalStorageKeys.applicationStateExample, {
      hourlyRate: 120,
      hours: 3,
    });

    hydrateEstimate();

    expect(sigEstimateHours.value).toBe(3);
    expect(sigEstimateHourlyRate.value).toBe(120);
    expect(sigEstimateTotal.value).toBe(360);
  });

  it("persists changes and reports storage availability", () => {
    const dispose = initEstimateSignalEffects();

    try {
      setEstimateHours(6);
      setEstimateHourlyRate(110);

      expect(appLocalStorage.get(appLocalStorageKeys.applicationStateExample)).toEqual({ hourlyRate: 110, hours: 6 });
      expect(sigEstimatePersistenceStatus.value).toBe("saved");
    } finally {
      dispose();
    }
  });

  it("stops persisting after the application effect is disposed", () => {
    const dispose = initEstimateSignalEffects();
    dispose();

    setEstimateHours(14);

    expect(appLocalStorage.get(appLocalStorageKeys.applicationStateExample)).toEqual(defaultPersistedEstimate);
  });

  it("keeps in-memory changes when persistence is unavailable", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    const dispose = initEstimateSignalEffects();

    try {
      setEstimateHours(10);

      expect(sigEstimateHours.value).toBe(10);
      expect(sigEstimatePersistenceStatus.value).toBe("unavailable");
    } finally {
      setItem.mockRestore();
      dispose();
    }
  });
});
