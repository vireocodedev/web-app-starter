import { describe, expect, it } from "vitest";

import { createSignalEffectsInitializer } from "@/app/bootstrap/signals/initSignalEffects";
import { signalModules } from "@/app/bootstrap/signals/signalModules";
import { applicationStateSignalModule } from "@/features/development-guide/patterns/applicationState";

describe("createSignalEffectsInitializer", () => {
  it("registers development-only example effects only in development", () => {
    expect(signalModules.includes(applicationStateSignalModule)).toBe(import.meta.env.DEV);
  });

  it("hydrates every registered module before starting and reversing effects", () => {
    const calls: string[] = [];
    const initialize = createSignalEffectsInitializer([
      {
        hydrate: () => calls.push("hydrate:first"),
        initEffects: () => {
          calls.push("effect:first");
          return () => calls.push("dispose:first");
        },
      },
      {
        hydrate: () => calls.push("hydrate:second"),
        initEffects: () => {
          calls.push("effect:second");
          return () => calls.push("dispose:second");
        },
      },
    ]);

    const dispose = initialize();

    expect(calls).toEqual(["hydrate:first", "hydrate:second", "effect:first", "effect:second"]);

    dispose();
    expect(calls).toEqual([
      "hydrate:first",
      "hydrate:second",
      "effect:first",
      "effect:second",
      "dispose:second",
      "dispose:first",
    ]);
  });
});
