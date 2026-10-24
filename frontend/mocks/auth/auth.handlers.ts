import { HttpResponse, http } from "msw";

import { appAuthSpringSessionEndpoints, serializeSpringSessionUser } from "@/app/auth/api/appAuth.api.springSession";
import { mockCsrfToken, mockLoginCredentials } from "./auth.fixtures";
import { mockAuthSessionStore } from "./auth.session";

const unauthorized = () =>
  HttpResponse.json(
    {
      code: "AUTHENTICATION_REQUIRED",
      message: "Authentication required",
      fieldErrors: [],
    },
    { status: 401 },
  );
const csrfDenied = () =>
  HttpResponse.json(
    {
      code: "CSRF_INVALID",
      message: "Request not permitted",
      fieldErrors: [],
    },
    { status: 403 },
  );

/** Mirrors the online adapter’s Spring-session-shaped HTTP contract. */
export function createAuthHandlers(apiBaseUrl: string) {
  const base = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const endpoint = (path: string) => `${base}/${path.replace(/^\//, "")}`;
  return [
    http.get(endpoint(appAuthSpringSessionEndpoints.csrf), () => HttpResponse.json(mockCsrfToken)),
    http.get(endpoint(appAuthSpringSessionEndpoints.session), () => {
      const user = mockAuthSessionStore.current();
      return user ? HttpResponse.json(serializeSpringSessionUser(user)) : unauthorized();
    }),
    http.post(endpoint(appAuthSpringSessionEndpoints.login), async ({ request }) => {
      if (request.headers.get(mockCsrfToken.headerName) !== mockCsrfToken.token) {
        return csrfDenied();
      }
      const payload: unknown = request.headers.get("content-type")?.includes("application/json")
        ? await request.json().catch(() => null)
        : null;
      if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
        return HttpResponse.json(
          { code: "INVALID_REQUEST", message: "The request is not valid", fieldErrors: [] },
          { status: 400 },
        );
      }
      const credentials = payload as Record<string, unknown>;
      if ([credentials.username, credentials.password].some(value => value != null && typeof value !== "string")) {
        return HttpResponse.json(
          { code: "INVALID_REQUEST", message: "The request is not valid", fieldErrors: [] },
          { status: 400 },
        );
      }
      const fieldErrors = (
        [
          { field: "username", max: 100 },
          { field: "password", max: 72 },
        ] as const
      ).flatMap(({ field, max }) => {
        const value = credentials[field];
        if (typeof value !== "string" || !value.trim()) return [{ field, code: "REQUIRED" }];
        return value.length > max ? [{ field, code: "TOO_LONG" }] : [];
      });
      if (fieldErrors.length) {
        return HttpResponse.json(
          { code: "VALIDATION_FAILED", message: "Some fields need attention", fieldErrors },
          { status: 400 },
        );
      }
      if (
        credentials.username !== mockLoginCredentials.username ||
        credentials.password !== mockLoginCredentials.password
      ) {
        return HttpResponse.json(
          { code: "AUTHENTICATION_FAILED", message: "Invalid credentials or expired session", fieldErrors: [] },
          { status: 401 },
        );
      }
      mockAuthSessionStore.start();
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(endpoint(appAuthSpringSessionEndpoints.logout), ({ request }) => {
      if (request.headers.get(mockCsrfToken.headerName) !== mockCsrfToken.token) {
        return csrfDenied();
      }
      mockAuthSessionStore.expire();
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}
