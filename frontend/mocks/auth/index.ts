import { mockLoginCredentials } from "./auth.fixtures";

export { createAuthHandlers } from "./auth.handlers";
export { mockAuthUser, mockCsrfToken, mockLoginCredentials } from "./auth.fixtures";
export { mockAuthSessionStore } from "./auth.session";

/** Mock-only login assistance supplied to the composition root at startup. */
export const mockLoginAssistance = mockLoginCredentials;
