import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse } from "axios";

import { createAppAuthRuntime } from "@/app/auth/createAppAuthRuntime";
import { createAppAxios } from "@/app/data/http/createAppAxios";
import { createAppQueryClient } from "@/app/data/query/createAppQueryClient";

export type AuthenticationScenario = "overview" | "invalidCredentials" | "unavailable" | "csrfFailure" | "expiry";

export const privateSampleKey = ["tutorial-private", "sample"] as const;
export const exampleCredentials = { username: "alex", password: "storybook-example" } as const;

/** A private transport boundary: no browser cookie, network, storage or global handlers. */
export function createAuthenticationFixture(scenario: AuthenticationScenario) {
  let authenticated = scenario === "expiry";
  let repaired = false;
  let csrfGeneration = 0;
  let loginPosts = 0;
  let protectedWrites = 0;
  let events: readonly string[] = [];
  const listeners = new Set<() => void>();
  const record = (message: string) => {
    events = [...events, message];
    listeners.forEach(listener => listener());
  };
  const publicError = (code: string) => ({
    code,
    message: "Synthetic server detail; never display directly.",
    fieldErrors: [],
  });
  const adapter: AxiosAdapter = async config => {
    const method = (config.method ?? "get").toUpperCase();
    const path = config.url;
    if (method === "POST" && path === "/auth/login") loginPosts += 1;
    if (method === "POST" && path === "/tutorial/change") protectedWrites += 1;
    record(`${method} ${path}`);
    let status = 200;
    let data: unknown;
    if (method === "GET" && path === "/auth/csrf") {
      if (scenario === "csrfFailure" && !repaired) {
        status = 503;
        data = publicError("INTERNAL_ERROR");
      } else {
        csrfGeneration += 1;
        data = { headerName: "X-CSRF-TOKEN", token: `synthetic-${csrfGeneration}` };
        record(`Fresh CSRF response ${csrfGeneration}.`);
      }
    } else if (method === "GET" && path === "/auth/session") {
      status = authenticated ? 200 : 401;
      data = authenticated
        ? { id: "tutorial-alex", displayName: "Alex Morgan", email: "alex@example.invalid" }
        : publicError("AUTHENTICATION_REQUIRED");
    } else if (method === "POST" && ["/auth/login", "/auth/logout", "/tutorial/change"].includes(path ?? "")) {
      const token = AxiosHeaders.from(config.headers).get("X-CSRF-TOKEN");
      if (csrfGeneration === 0 || token !== `synthetic-${csrfGeneration}`) {
        status = 403;
        data = publicError("CSRF_INVALID");
      } else if (path === "/auth/login") {
        const body: unknown = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
        const credentials = body as { username?: unknown; password?: unknown };
        if (scenario === "unavailable" && !repaired) {
          status = 503;
          data = publicError("INTERNAL_ERROR");
        } else if (
          credentials.username !== exampleCredentials.username ||
          credentials.password !== exampleCredentials.password
        ) {
          status = 401;
          data = publicError("AUTHENTICATION_FAILED");
        } else {
          authenticated = true;
          status = 204;
          record("Login acknowledged; the simulated session rotates its CSRF token.");
          csrfGeneration += 1;
        }
      } else if (!authenticated) {
        status = 401;
        data = publicError("AUTHENTICATION_REQUIRED");
      } else {
        status = 204;
        if (path === "/auth/logout") authenticated = false;
      }
    } else if (method === "GET" && path === "/tutorial/protected") {
      if (scenario === "expiry") authenticated = false;
      status = authenticated ? 200 : 401;
      data = authenticated ? { result: "Protected read completed." } : publicError("AUTHENTICATION_REQUIRED");
    } else {
      throw new Error(`No tutorial fixture for ${method} ${path}.`);
    }
    const response: AxiosResponse = { config, data, headers: new AxiosHeaders(), status, statusText: String(status) };
    // Axios custom adapters own status settlement. Resolving a 401 would bypass real error classification.
    if (status >= 400)
      throw new AxiosError(`Synthetic HTTP ${status}`, AxiosError.ERR_BAD_RESPONSE, config, undefined, response);
    return response;
  };
  const http = createAppAxios({
    VITE_API_BASE_URL: "https://storybook.example.invalid/api",
    VITE_API_MODE: "http",
    VITE_API_WITH_CREDENTIALS: true,
    VITE_APP_ENV: "test",
    VITE_REQUEST_TIMEOUT_MS: 1_000,
  });
  const transportLifetime = new AbortController();
  http.defaults.signal = transportLifetime.signal;
  http.defaults.adapter = adapter;
  const queryClient = createAppQueryClient({ retry: () => false });
  const auth = createAppAuthRuntime({ http, queryClient });
  if (authenticated) queryClient.setQueryData(privateSampleKey, "Private sample for Alex");
  return {
    auth,
    http,
    queryClient,
    getEvents: () => events,
    getCounts: () => ({ loginPosts, protectedWrites }),
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    repair: () => {
      repaired = true;
      record("The simulated server is available again.");
    },
    dispose: () => {
      transportLifetime.abort();
      void queryClient.cancelQueries();
      queryClient.clear();
      // These chains belong exclusively to this disposable transport, never the running app.
      http.interceptors.request.clear();
      http.interceptors.response.clear();
      listeners.clear();
    },
  };
}
