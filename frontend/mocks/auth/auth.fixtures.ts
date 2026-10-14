import type { AppAuthUser } from "@/app/auth/models/AppAuthUser";

/** Demo-only identity; no password or token is persisted by the mock. */
export const mockAuthUser: AppAuthUser = {
  displayName: "RGO Demo User",
  email: "demo@rgo.hr",
  id: "demo-user",
};

export const mockLoginCredentials = {
  password: "demo-password",
  username: "demo",
} as const;

export const mockCsrfToken = {
  headerName: "X-CSRF-TOKEN",
  token: "mock-csrf-token",
} as const;
