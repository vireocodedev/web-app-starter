import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { AppInvalidCredentialsError } from "@/app/auth/api/appAuth.api";
import { createSpringSessionAppAuthApi } from "@/app/auth/api/appAuth.api.springSession";
import { createAppAxios } from "@/app/data/http/createAppAxios";
import { server } from "@test/server";

const apiBaseUrl = "https://compatibility.example.invalid/api";

// Independent baseline fixtures: do not derive expected wire data from production serializers.
const baselineSession = Object.freeze({
  id: "7f38817e-8570-44e3-9685-fc1487ec1c61",
  displayName: "Compatibility User",
  email: "compatibility@example.test",
});
const baselineCsrf = Object.freeze({ headerName: "X-CSRF-TOKEN", token: "synthetic-compatibility-token" });
const baselineLogin = Object.freeze({ username: "compatibility-user", password: "synthetic-password" });

function createApi() {
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

function withoutField(value: Readonly<Record<string, unknown>>, field: string) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== field));
}

describe("Spring-session wire compatibility", () => {
  it("continues reading the established session response", async () => {
    server.use(http.get(`${apiBaseUrl}/auth/session`, () => HttpResponse.json(baselineSession)));

    expect(await createApi().getSession()).toEqual(baselineSession);
  });

  it("strips additive response fields without changing known identity values", async () => {
    server.use(
      http.get(`${apiBaseUrl}/auth/session`, () =>
        HttpResponse.json({ ...baselineSession, preferredName: "Future name", department: { title: "New field" } }),
      ),
    );

    expect(await createApi().getSession()).toEqual(baselineSession);
  });

  it.each([
    ...["id", "displayName", "email"].map(field => ({
      label: `missing ${field}`,
      body: withoutField(baselineSession, field),
    })),
    ...["id", "displayName", "email"].map(field => ({
      label: `null ${field}`,
      body: { ...baselineSession, [field]: null },
    })),
    { label: "numeric id", body: { ...baselineSession, id: 123 } },
    { label: "empty id", body: { ...baselineSession, id: "" } },
    { label: "empty display name", body: { ...baselineSession, displayName: "" } },
    { label: "invalid email", body: { ...baselineSession, email: "invalid-email" } },
  ])("rejects incompatible known session fields: $label", async ({ body }) => {
    server.use(http.get(`${apiBaseUrl}/auth/session`, () => HttpResponse.json(body)));

    await expect(createApi().getSession()).rejects.toBeInstanceOf(ZodError);
  });

  it("keeps the established login wire shape when callers carry additional properties", async () => {
    let submitted: unknown;
    let contentType: string | null = null;
    const operations: string[] = [];
    server.use(
      http.get(`${apiBaseUrl}/auth/csrf`, () => {
        operations.push("csrf");
        return HttpResponse.json(baselineCsrf);
      }),
      http.post(`${apiBaseUrl}/auth/login`, async ({ request }) => {
        operations.push("login");
        submitted = await request.json();
        contentType = request.headers.get("Content-Type");
        expect(request.headers.get("X-CSRF-TOKEN")).toBe("synthetic-compatibility-token");
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const extendedInput = { ...baselineLogin, ...baselineSession, role: "ADMIN", preferredName: "Response only" };

    await expect(createApi().login(extendedInput)).resolves.toBeUndefined();

    expect(operations).toEqual(["csrf", "login"]);
    expect(contentType).toBe("application/json");
    expect(submitted).toEqual({ username: "compatibility-user", password: "synthetic-password" });
  });

  it("accepts additive CSRF metadata while retaining the confirmed token header", async () => {
    let writes = 0;
    server.use(
      http.get(`${apiBaseUrl}/auth/csrf`, () =>
        HttpResponse.json({ ...baselineCsrf, expiresAt: "2030-01-01T00:00:00Z" }),
      ),
      http.post(`${apiBaseUrl}/auth/login`, ({ request }) => {
        writes += 1;
        expect(request.headers.get("X-CSRF-TOKEN")).toBe("synthetic-compatibility-token");
        expect(request.headers.has("expiresAt")).toBe(false);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(createApi().login(baselineLogin)).resolves.toBeUndefined();
    expect(writes).toBe(1);
  });

  it.each([
    { label: "missing token", body: withoutField(baselineCsrf, "token") },
    { label: "null token", body: { ...baselineCsrf, token: null } },
    { label: "numeric token", body: { ...baselineCsrf, token: 123 } },
    { label: "empty token", body: { ...baselineCsrf, token: "" } },
    { label: "missing header", body: withoutField(baselineCsrf, "headerName") },
    { label: "changed header", body: { ...baselineCsrf, headerName: "X-NEW-CSRF-TOKEN" } },
  ])("rejects incompatible CSRF fields before sending credentials: $label", async ({ body }) => {
    let writes = 0;
    server.use(
      http.get(`${apiBaseUrl}/auth/csrf`, () => HttpResponse.json(body)),
      http.post(`${apiBaseUrl}/auth/login`, () => {
        writes += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(createApi().login(baselineLogin)).rejects.toBeInstanceOf(ZodError);
    expect(writes).toBe(0);
  });

  it("keeps credential classification stable when only diagnostic text and extra metadata change", async () => {
    server.use(
      http.get(`${apiBaseUrl}/auth/csrf`, () => HttpResponse.json(baselineCsrf)),
      http.post(`${apiBaseUrl}/auth/login`, () =>
        HttpResponse.json(
          { code: "AUTHENTICATION_FAILED", message: "Changed diagnostic prose", fieldErrors: [], diagnostic: "extra" },
          { status: 401 },
        ),
      ),
    );

    await expect(createApi().login(baselineLogin)).rejects.toBeInstanceOf(AppInvalidCredentialsError);
  });

  it("does not conceal an incompatible status change behind a familiar error code", async () => {
    server.use(
      http.get(`${apiBaseUrl}/auth/csrf`, () => HttpResponse.json(baselineCsrf)),
      http.post(`${apiBaseUrl}/auth/login`, () =>
        HttpResponse.json(
          { code: "AUTHENTICATION_FAILED", message: "Unexpected status", fieldErrors: [] },
          { status: 403 },
        ),
      ),
    );

    await expect(createApi().login(baselineLogin)).rejects.toMatchObject({ response: { status: 403 } });
  });
});
