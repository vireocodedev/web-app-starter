import { HttpResponse, http } from "msw";

import {
  appAuthSpringSessionEndpoints,
  parseSpringSessionLogin,
  serializeSpringSessionUser,
} from "@/app/auth/api/appAuth.api.springSession";
import { mockCsrfToken, mockLoginCredentials } from "./auth.fixtures";
import { mockAuthSessionStore } from "./auth.session";

const unauthorized = () => new HttpResponse(null, { status: 401 });

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
        return new HttpResponse(null, { status: 403 });
      }
      const credentials = await parseSpringSessionLogin(request);
      if (
        !credentials ||
        credentials.username !== mockLoginCredentials.username ||
        credentials.password !== mockLoginCredentials.password
      ) {
        return unauthorized();
      }
      mockAuthSessionStore.start();
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(endpoint(appAuthSpringSessionEndpoints.logout), ({ request }) => {
      if (request.headers.get(mockCsrfToken.headerName) !== mockCsrfToken.token) {
        return new HttpResponse(null, { status: 403 });
      }
      mockAuthSessionStore.expire();
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}
