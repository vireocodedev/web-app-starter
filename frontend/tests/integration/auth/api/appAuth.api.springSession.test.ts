import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { createAppAxios } from "@/app/data/http/createAppAxios";
import { server } from "@test/server";
import { createAuthHandlers, mockAuthSessionStore, mockCsrfToken, mockLoginCredentials } from "@mocks/auth";
import { AppInvalidCredentialsError } from "@/app/auth/api/appAuth.api";
import { appAuthSpringSessionEndpoints, createSpringSessionAppAuthApi } from "@/app/auth/api/appAuth.api.springSession";

const apiBaseUrl = "https://api.example.invalid";

function createApi() {
  server.use(...createAuthHandlers(apiBaseUrl));
  return createSpringSessionAppAuthApi(
    createAppAxios({
      VITE_API_BASE_URL: apiBaseUrl,
      VITE_APP_ENV: "test",
      VITE_API_MODE: "http",
      VITE_API_WITH_CREDENTIALS: true,
      VITE_REQUEST_TIMEOUT_MS: 1_000,
    }),
  );
}

afterEach(() => mockAuthSessionStore.reset());

describe("Spring-session application authentication API", () => {
  it("maps an anonymous session response to null", async () => {
    await expect(createApi().getSession()).resolves.toBeNull();
  });

  it("uses login, session, and logout as one opaque session contract", async () => {
    const api = createApi();

    await expect(api.login(mockLoginCredentials)).resolves.toBeUndefined();
    await expect(api.getSession()).resolves.toMatchObject({ id: "demo-user" });
    await expect(api.logout()).resolves.toBeUndefined();
    await expect(api.getSession()).resolves.toBeNull();
  });

  it("keeps invalid login credentials as a rejected mutation", async () => {
    await expect(createApi().login({ password: "wrong", username: "demo" })).rejects.toBeInstanceOf(
      AppInvalidCredentialsError,
    );
  });

  it.each([
    [{ username: " ", password: "secret" }, "username", "REQUIRED"],
    [{ username: "a".repeat(101), password: "secret" }, "username", "TOO_LONG"],
    [{ username: "demo", password: "a".repeat(73) }, "password", "TOO_LONG"],
  ] as const)(
    "keeps mocked backend validation separate from credential rejection %#",
    async (credentials, field, code) => {
      const api = createApi();
      const failure = await api.login(credentials).catch((error: unknown) => error);
      expect(failure).toMatchObject({
        response: {
          status: 400,
          data: {
            code: "VALIDATION_FAILED",
            fieldErrors: [{ field, code }],
          },
        },
      });
      expect(failure).not.toBeInstanceOf(AppInvalidCredentialsError);
      await expect(api.getSession()).resolves.toBeNull();
    },
  );

  it("does not mislabel an unavailable server as invalid credentials", async () => {
    const api = createApi();
    server.use(
      http.post(`${apiBaseUrl}${appAuthSpringSessionEndpoints.login}`, () =>
        HttpResponse.json({ message: "unavailable" }, { status: 503 }),
      ),
    );

    const failure = await api.login(mockLoginCredentials).catch(error => error);

    expect(failure).toMatchObject({ response: { status: 503 } });
    expect(failure).not.toBeInstanceOf(AppInvalidCredentialsError);
  });

  it("fetches a fresh CSRF token for login, logout, and other application mutations", async () => {
    let tokenCount = 0;
    const httpClient = createAppAxios({
      VITE_API_BASE_URL: apiBaseUrl,
      VITE_APP_ENV: "test",
      VITE_API_MODE: "http",
      VITE_API_WITH_CREDENTIALS: true,
      VITE_REQUEST_TIMEOUT_MS: 1_000,
    });
    server.use(
      http.get(`${apiBaseUrl}${appAuthSpringSessionEndpoints.csrf}`, () =>
        HttpResponse.json({ ...mockCsrfToken, token: `token-${++tokenCount}` }),
      ),
      ...[appAuthSpringSessionEndpoints.login, appAuthSpringSessionEndpoints.logout, "/example"].map(endpoint =>
        http.post(`${apiBaseUrl}${endpoint}`, ({ request }) => {
          expect(request.headers.get(mockCsrfToken.headerName)).toBe(`token-${tokenCount}`);
          return new HttpResponse(null, { status: 204 });
        }),
      ),
    );
    const api = createSpringSessionAppAuthApi(httpClient);

    await api.login(mockLoginCredentials);
    await api.logout();
    await httpClient.post("/example");

    expect(tokenCount).toBe(3);
  });

  it("does not submit credentials when CSRF retrieval fails", async () => {
    const api = createApi();
    let loginCount = 0;
    server.use(
      http.get(`${apiBaseUrl}${appAuthSpringSessionEndpoints.csrf}`, () => new HttpResponse(null, { status: 503 })),
      http.post(`${apiBaseUrl}${appAuthSpringSessionEndpoints.login}`, () => {
        loginCount += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(api.login(mockLoginCredentials)).rejects.toMatchObject({ response: { status: 503 } });
    expect(loginCount).toBe(0);
  });

  it("does not mislabel a CSRF preflight 401 or submit the login request", async () => {
    const api = createApi();
    let loginCount = 0;
    server.use(
      http.get(`${apiBaseUrl}${appAuthSpringSessionEndpoints.csrf}`, () =>
        HttpResponse.json(
          {
            code: "AUTHENTICATION_FAILED",
            message: "private diagnostic",
            fieldErrors: [],
          },
          { status: 401 },
        ),
      ),
      http.post(`${apiBaseUrl}${appAuthSpringSessionEndpoints.login}`, () => {
        loginCount += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const failure = await api.login(mockLoginCredentials).catch((error: unknown) => error);
    expect(failure).toMatchObject({ response: { status: 401 }, config: { url: appAuthSpringSessionEndpoints.csrf } });
    expect(failure).not.toBeInstanceOf(AppInvalidCredentialsError);
    expect(loginCount).toBe(0);
  });

  it.each([
    { message: "legacy response" },
    { code: "UNKNOWN", message: "private diagnostic", fieldErrors: [] },
    { code: "AUTHENTICATION_REQUIRED", message: "private diagnostic", fieldErrors: [] },
  ])("keeps unrecognized login 401s as original transport failures %#", async body => {
    const api = createApi();
    server.use(
      http.post(`${apiBaseUrl}${appAuthSpringSessionEndpoints.login}`, () => HttpResponse.json(body, { status: 401 })),
    );
    const failure = await api.login(mockLoginCredentials).catch((error: unknown) => error);
    expect(failure).toMatchObject({ response: { status: 401 } });
    expect(failure).not.toBeInstanceOf(AppInvalidCredentialsError);
  });

  it("rejects a malformed CSRF response instead of sending an unprotected mutation", async () => {
    const api = createApi();
    server.use(
      http.get(`${apiBaseUrl}${appAuthSpringSessionEndpoints.csrf}`, () =>
        HttpResponse.json({ headerName: "Unexpected-Header", token: "" }),
      ),
    );

    await expect(api.login(mockLoginCredentials)).rejects.toMatchObject({ name: "ZodError" });
    await expect(api.getSession()).resolves.toBeNull();
  });
});
