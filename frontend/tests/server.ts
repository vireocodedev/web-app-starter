import { setupServer } from "msw/node";

/**
 * Tests add only the HTTP handlers required for their scenario with server.use.
 * The global setup resets those overrides after every test.
 */
export const server = setupServer();
