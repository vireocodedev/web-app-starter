import { batch, computed, effect, signal } from "@preact/signals-react";
import { createRgoSignalEffectsService, type SignalEffectsModule } from "@rgo-web/frontend";
import { z } from "zod";

const estimateSchema = z.object({
  hours: z.number().finite().nonnegative(),
  hourlyRate: z.number().finite().nonnegative(),
});
const defaults = { hours: 8, hourlyRate: 75 };
const normalize = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0);

/** Private, validated memory storage and Signals. Never touches the application's singleton state. */
export function createSignalPersistenceFixture(scenario: "overview" | "failure" | "disposed") {
  let raw: unknown = { hours: 4, hourlyRate: 90 };
  const hours = signal(defaults.hours);
  const hourlyRate = signal(defaults.hourlyRate);
  const total = computed(() => hours.value * hourlyRate.value);
  const status = signal<"idle" | "saved" | "unavailable">("idle");
  const active = signal(false);
  const writes = signal(0);
  const stored = signal(JSON.stringify(raw));
  const events = signal<string[]>([]);
  const unavailable = signal(scenario === "failure");
  let disposeGeneration: (() => void) | undefined;
  const log = (message: string) => {
    events.value = [...events.peek().slice(-11), message];
  };

  const module: SignalEffectsModule = {
    hydrate: () => {
      const parsed = estimateSchema.safeParse(raw);
      const restored = parsed.success ? parsed.data : defaults;
      batch(() => {
        hours.value = restored.hours;
        hourlyRate.value = restored.hourlyRate;
      });
      log(parsed.success ? "Estimate hydrated from validated storage." : "Invalid storage recovered to defaults.");
    },
    initEffects: () => {
      log("Persistence effect started after hydration.");
      const stop = effect(() => {
        const value = estimateSchema.parse({ hours: hours.value, hourlyRate: hourlyRate.value });
        try {
          // peek makes storage availability an external condition, not a persistence dependency.
          if (unavailable.peek()) throw new Error("Simulated storage write failure");
          raw = value;
          stored.value = JSON.stringify(value);
          writes.value = writes.peek() + 1;
          status.value = "saved";
          log("Source values persisted; computed total was not stored.");
        } catch {
          status.value = "unavailable";
          log("Storage write failed; live source values retained.");
        }
      });
      return () => {
        stop();
        log("Persistence effect disposed.");
      };
    },
  };
  const lifecycle = createRgoSignalEffectsService([module]);
  function start() {
    disposeGeneration = lifecycle.initialize();
    active.value = true;
  }
  function dispose() {
    disposeGeneration?.();
    active.value = false;
  }
  return {
    hours,
    hourlyRate,
    total,
    status,
    active,
    writes,
    stored,
    events,
    unavailable,
    start,
    dispose,
    initialize: () => {
      start();
      if (scenario === "disposed") dispose();
    },
    restart: () => {
      dispose();
      start();
    },
    setHours: (value: number) => {
      hours.value = normalize(value);
    },
    setHourlyRate: (value: number) => {
      hourlyRate.value = normalize(value);
    },
    applyBatch: () =>
      batch(() => {
        hours.value = 10;
        hourlyRate.value = 120;
      }),
    corruptAndRestart: () => {
      dispose();
      raw = { hours: "invalid", hourlyRate: -1 };
      stored.value = JSON.stringify(raw);
      start();
    },
    recoverStorage: () => {
      unavailable.value = false;
      dispose();
      start();
    },
  };
}
