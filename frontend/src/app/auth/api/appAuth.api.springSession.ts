import axios, { type AxiosInstance } from "axios";
import { z } from "zod";

import { decodeAppHttpError } from "@/app/data/http/appHttpError";
import { AppInvalidCredentialsError, type AppAuthApi } from "./appAuth.api";
import { appLoginCredentialsSchema, type AppLoginCredentials } from "../models/AppLoginCredentials";
import { appAuthUserSchema } from "../models/AppAuthUser";
import type { AppAuthUser } from "../models/AppAuthUser";

/**
 * The only application file that knows the concrete Spring-session HTTP
 * contract. Adapt this module when the backend differs from the starter
 * contract; the rest of the authentication module stays unchanged.
 */
export const appAuthSpringSessionEndpoints = {
  csrf: "/auth/csrf",
  login: "/auth/login",
  logout: "/auth/logout",
  session: "/auth/session",
} as const;

const springSessionCsrfSchema = z.object({
  headerName: z.literal("X-CSRF-TOKEN"),
  token: z.string().min(1),
});

type SpringSessionJsonValue = boolean | null | number | string | SpringSessionJsonObject | SpringSessionJsonValue[];

/** A transport-neutral JSON object suitable for mocked HTTP response bodies. */
export interface SpringSessionJsonObject {
  [key: string]: SpringSessionJsonValue;
}

/**
 * Converts application credentials into the concrete login request. Keep its
 * inverse below aligned when adapting JSON to form encoding or another wire
 * format for a Spring backend. Project writable fields explicitly: structurally
 * compatible callers can carry additional response-only properties.
 */
export function serializeSpringSessionLogin(credentials: AppLoginCredentials) {
  return {
    body: { username: credentials.username, password: credentials.password },
    headers: { "Content-Type": "application/json" },
  } as const;
}

/** Parses the concrete login request so MSW mirrors the real adapter exactly. */
export async function parseSpringSessionLogin(request: Request): Promise<AppLoginCredentials | null> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return null;
  }
  const payload = await request.json().catch(() => null);
  return appLoginCredentialsSchema.safeParse(payload).data ?? null;
}

/** Maps a backend session DTO into the stable application identity. */
export function parseSpringSessionUser(payload: unknown): AppAuthUser {
  return appAuthUserSchema.parse(payload);
}

/** Produces the matching mock response when the backend session DTO changes. */
export function serializeSpringSessionUser(user: AppAuthUser): SpringSessionJsonObject {
  return {
    displayName: user.displayName,
    email: user.email,
    id: user.id,
  };
}

function hasEndpoint(url: unknown, endpoint: string) {
  return typeof url === "string" && url.endsWith(endpoint);
}

function isAnonymousSessionResponse(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

function isInvalidCredentialsResponse(error: unknown) {
  return (
    axios.isAxiosError(error) &&
    error.config?.method?.toUpperCase() === "POST" &&
    hasEndpoint(error.config.url, appAuthSpringSessionEndpoints.login) &&
    decodeAppHttpError(error)?.code === "AUTHENTICATION_FAILED"
  );
}

/** Uses the real HTTP contract in every mode; MSW replaces only the server. */
export function createSpringSessionAppAuthApi(http: AxiosInstance): AppAuthApi {
  // Fetch a fresh session-bound token for every mutation, including after login
  // rotates it. Never retry mutations automatically or persist tokens in storage.
  http.interceptors.request.use(async request => {
    if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes((request.method ?? "GET").toUpperCase())) {
      const response = await http.get(appAuthSpringSessionEndpoints.csrf);
      const csrf = springSessionCsrfSchema.parse(response.data);
      request.headers.set(csrf.headerName, csrf.token);
    }
    return request;
  });

  return {
    async getSession() {
      try {
        const response = await http.get(appAuthSpringSessionEndpoints.session);
        return parseSpringSessionUser(response.data);
      } catch (error) {
        if (isAnonymousSessionResponse(error)) return null;
        throw error;
      }
    },
    async login(credentials: AppLoginCredentials) {
      try {
        const request = serializeSpringSessionLogin(credentials);
        await http.post(appAuthSpringSessionEndpoints.login, request.body, {
          headers: request.headers,
        });
      } catch (error) {
        if (isInvalidCredentialsResponse(error)) {
          throw new AppInvalidCredentialsError();
        }
        throw error;
      }
    },
    async logout() {
      await http.post(appAuthSpringSessionEndpoints.logout);
    },
  };
}

/** Installs the auth-owned observer for unexpected expired server sessions. */
export function observeSpringSessionExpiry(http: AxiosInstance, onSessionExpired: () => void) {
  return http.interceptors.response.use(undefined, (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !hasEndpoint(error.config?.url, appAuthSpringSessionEndpoints.login) &&
      !hasEndpoint(error.config?.url, appAuthSpringSessionEndpoints.session)
    ) {
      onSessionExpired();
    }
    return Promise.reject(error);
  });
}
