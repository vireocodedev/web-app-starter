import { describe, expect, it, vi } from "vitest";

import { createServerDataExampleApi } from "../../../../../docs/storybook/patterns/ServerData/api/serverData.api";

describe("createServerDataExampleApi", () => {
  it("recovers when a controlled failed request is retried", async () => {
    const api = createServerDataExampleApi({ delayMs: 0 });

    await expect(api.findAll({ outcome: "error" })).rejects.toThrow("serverDataExamples.shared.requestFailed");
    await expect(api.findAll({ outcome: "error" })).resolves.toMatchObject({
      total: 6,
    });
  });

  it("clears delayed work and rejects with AbortError when cancelled", async () => {
    vi.useFakeTimers();
    const clearTimeout = vi.spyOn(globalThis, "clearTimeout");
    const api = createServerDataExampleApi({ delayMs: 1_000 });
    const controller = new AbortController();
    const request = api.findAll({}, { signal: controller.signal });

    controller.abort();

    await expect(request).rejects.toMatchObject({ name: "AbortError" });
    expect(clearTimeout).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
