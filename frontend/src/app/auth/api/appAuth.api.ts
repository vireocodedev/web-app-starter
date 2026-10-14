import type { AppLoginCredentials } from "../models/AppLoginCredentials";
import type { AppAuthUser } from "../models/AppAuthUser";

export class AppInvalidCredentialsError extends Error {
  constructor() {
    super("The supplied login credentials were rejected.");
    this.name = "AppInvalidCredentialsError";
  }
}

/** Transport seam for an opaque server-managed session. */
export type AppAuthApi = Readonly<{
  getSession(): Promise<AppAuthUser | null>;
  login(credentials: AppLoginCredentials): Promise<void>;
  logout(): Promise<void>;
}>;
