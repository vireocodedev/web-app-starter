import { AxiosError, CanceledError, type AxiosResponse } from "axios";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { appHttpErrorMessageKey, decodeAppHttpError } from "@/app/data/http/appHttpError";
import { createAppAxios } from "@/app/data/http/createAppAxios";
import { createAppQueryClient } from "@/app/data/query/createAppQueryClient";
import { server } from "@test/server";

function failure(data: unknown, status = 400) {
  return new AxiosError("private transport details", undefined, undefined, undefined, {
    config: { headers: {} },
    data,
    headers: {},
    status,
    statusText: "",
  } as AxiosResponse);
}
const validation = { code: "VALIDATION_FAILED", message: "private server prose", fieldErrors: [] };

describe("shared HTTP error contract", () => {
  it.each([
    ["VALIDATION_FAILED", 400],
    ["INVALID_REQUEST", 400],
    ["AUTHENTICATION_REQUIRED", 401],
    ["AUTHENTICATION_FAILED", 401],
    ["CSRF_INVALID", 403],
    ["FORBIDDEN", 403],
    ["RESOURCE_NOT_FOUND", 404],
    ["VERSION_CONFLICT", 409],
    ["RESOURCE_IN_USE", 409],
    ["REQUEST_REJECTED", 405],
    ["REQUEST_REJECTED", 429],
    ["INTERNAL_ERROR", 500],
    ["INTERNAL_ERROR", 503],
  ])("recognizes %s at status %s without returning server prose", (code, status) => {
    const decoded = decodeAppHttpError(failure({ ...validation, code, rejectedValue: "secret" }, status));
    expect(decoded).toEqual({ code, fieldErrors: [] });
    expect(appHttpErrorMessageKey(decoded)).toMatch(/^httpErrors\./);
  });

  it.each([
    null,
    "<html>private proxy error</html>",
    { message: "legacy response" },
    { ...validation, code: "UNKNOWN" },
    { ...validation, code: "AUTHENTICATION_FAILED" },
    { ...validation, fieldErrors: null },
    { ...validation, message: 9 },
    { ...validation, message: "x".repeat(513) },
    { ...validation, fieldErrors: Array.from({ length: 33 }, () => ({ field: "username", code: "REQUIRED" })) },
    { ...validation, fieldErrors: [{ field: "x".repeat(101), code: "REQUIRED" }] },
    { ...validation, fieldErrors: [{ field: "username", code: "x".repeat(101) }] },
    { ...validation, fieldErrors: [{ field: "username" }] },
    Object.create(validation),
  ])("falls back safely for malformed, unknown, oversized or incompatible data %#", data => {
    expect(decodeAppHttpError(failure(data), ["username"])).toBeNull();
    expect(appHttpErrorMessageKey(null)).toBeNull();
  });

  it("accepts only consumer fields and known field codes, without prototype or duplicate keys", () => {
    const decoded = decodeAppHttpError(
      failure({
        ...validation,
        fieldErrors: [
          { field: "username", code: "TOO_LONG", rejectedValue: "secret" },
          { field: "username", code: "REQUIRED" },
          { field: "password", code: "REQUIRED" },
          { field: "email", code: "REQUIRED" },
          { field: "other", code: "UNKNOWN" },
          ...["__proto__", "constructor", "prototype"].map(field => ({ field, code: "REQUIRED" })),
        ],
      }),
      ["username", "password", "other", "__proto__", "constructor", "prototype"],
    );
    expect(decoded).toEqual({
      code: "VALIDATION_FAILED",
      fieldErrors: [
        { field: "username", code: "TOO_LONG" },
        { field: "password", code: "REQUIRED" },
      ],
    });
    expect(
      decodeAppHttpError(failure({ ...validation, fieldErrors: [{ field: "username", code: "REQUIRED" }] }))
        ?.fieldErrors,
    ).toEqual([]);
    expect(Object.hasOwn({}, "polluted")).toBe(false);
  });

  it.each([
    ["RESOURCE_NOT_FOUND", 409],
    ["VERSION_CONFLICT", 404],
    ["RESOURCE_IN_USE", 500],
  ])("rejects incompatible %s status %s without changing the failure", (code, status) => {
    const error = failure({ ...validation, code }, status);
    const response = error.response;
    expect(decodeAppHttpError(error)).toBeNull();
    expect(error.response).toBe(response);
    expect(error.message).toBe("private transport details");
  });

  it("ignores field metadata on non-validation errors", () => {
    expect(
      decodeAppHttpError(
        failure({ ...validation, code: "INVALID_REQUEST", fieldErrors: [{ field: "username", code: "REQUIRED" }] }),
        ["username"],
      )?.fieldErrors,
    ).toEqual([]);
  });

  it("keeps non-HTTP, network and cancelled failures out of the protocol", () => {
    for (const error of [new Error("unexpected"), new AxiosError("offline"), new CanceledError()]) {
      expect(decodeAppHttpError(error)).toBeNull();
    }
  });

  it("preserves a real Axios failure and retry status through shared decoding", async () => {
    server.use(
      http.get("https://api.example.invalid/resource", () =>
        HttpResponse.json(
          {
            code: "INTERNAL_ERROR",
            message: "private diagnostic",
            fieldErrors: [],
          },
          { status: 503 },
        ),
      ),
    );
    const client = createAppAxios({
      VITE_API_BASE_URL: "https://api.example.invalid",
      VITE_API_MODE: "http",
      VITE_API_WITH_CREDENTIALS: true,
      VITE_APP_ENV: "test",
      VITE_REQUEST_TIMEOUT_MS: 1000,
    });
    const error: unknown = await client.get("/resource").catch((error: unknown) => error);
    const originalResponse = (error as AxiosError).response;
    expect(decodeAppHttpError(error)).toEqual({ code: "INTERNAL_ERROR", fieldErrors: [] });
    expect(error).toBeInstanceOf(AxiosError);
    if (!(error instanceof AxiosError)) throw error;
    expect((error as AxiosError).response).toBe(originalResponse);
    expect((error as AxiosError).config?.url).toBe("/resource");
    const retry = createAppQueryClient().getDefaultOptions().queries?.retry;
    if (typeof retry !== "function") throw new Error("Missing retry policy");
    expect(retry(0, error)).toBe(true);
    expect(retry(2, error)).toBe(false);
  });
});
