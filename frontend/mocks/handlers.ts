import { createAuthHandlers } from "./auth";

export function createMockHandlers(apiBaseUrl: string) {
  return createAuthHandlers(apiBaseUrl);
}
