import { AxiosError, CanceledError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import { createAppQueryClient } from "@/app/data/query/createAppQueryClient";

function httpError(status: number) {
  const response = {
    config: { headers: {} },
    data: undefined,
    headers: {},
    status,
    statusText: "",
  } as AxiosResponse;

  return new AxiosError("Request failed", undefined, undefined, undefined, response);
}

function queryRetryPolicy() {
  const retry = createAppQueryClient().getDefaultOptions().queries?.retry;
  if (typeof retry !== "function") {
    throw new Error("Application query retry policy must be a function.");
  }
  return retry;
}

describe("createAppQueryClient", () => {
  it("does not retry cancellations or ordinary client errors", () => {
    const retry = queryRetryPolicy();

    expect(retry(0, new CanceledError())).toBe(false);
    expect(retry(0, httpError(404))).toBe(false);
    expect(retry(0, new Error("unknown"))).toBe(false);
  });

  it("bounds network and retryable failures", () => {
    const retry = queryRetryPolicy();

    expect(retry(0, httpError(408))).toBe(true);
    expect(retry(1, httpError(429))).toBe(true);
    expect(retry(1, httpError(503))).toBe(true);
    expect(retry(0, new AxiosError("offline"))).toBe(true);
    expect(retry(2, new AxiosError("offline"))).toBe(false);
    expect(retry(2, httpError(503))).toBe(false);
  });
});
