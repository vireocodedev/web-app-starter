import { afterEach, describe, expect, it, vi } from "vitest";
import { createAsyncLookupApi } from "@/features/development-guide/patterns/forms/api/asyncLookup.api";

afterEach(() => vi.useRealTimers());

describe("async lookup fixture", () => {
  it("filters by department and search and exposes empty results", async () => {
    const api = createAsyncLookupApi({ delayMs: 0 });
    const signal = new AbortController().signal;
    expect(await api.findPeople({ department: "operations", search: " LIN " }, signal)).toEqual([
      { id: "lin", label: "Lin Lanying", department: "operations" },
    ]);
    expect(await api.findPeople({ department: "engineering", search: "Lin" }, signal)).toEqual([]);
  });

  it("aborts pending and already aborted requests without consuming the first failure", async () => {
    vi.useFakeTimers();
    const api = createAsyncLookupApi({ failFirst: true });
    const controller = new AbortController();
    const pending = api.findPeople({ search: "" }, controller.signal);
    const rejected = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });
    controller.abort();
    await rejected;
    await expect(api.findPeople({ search: "" }, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    expect(vi.getTimerCount()).toBe(0);
    const first = api.findPeople({ search: "" }, new AbortController().signal);
    const failure = expect(first).rejects.toThrow("Lookup unavailable");
    await vi.runAllTimersAsync();
    await failure;
    const retry = api.findPeople({ search: "" }, new AbortController().signal);
    await vi.runAllTimersAsync();
    expect(await retry).toHaveLength(4);
  });

  it("isolates the controlled failure between preview instances", async () => {
    const first = createAsyncLookupApi({ delayMs: 0, failFirst: true });
    const second = createAsyncLookupApi({ delayMs: 0, failFirst: true });
    const signal = new AbortController().signal;
    await expect(first.findPeople({ search: "" }, signal)).rejects.toThrow();
    expect(await first.findPeople({ search: "" }, signal)).toHaveLength(4);
    await expect(second.findPeople({ search: "" }, signal)).rejects.toThrow();
  });
});
