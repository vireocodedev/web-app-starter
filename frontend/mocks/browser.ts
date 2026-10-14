import { setupWorker } from "msw/browser";

import { createMockHandlers } from "./handlers";
import { mockAuthSessionStore, mockLoginAssistance } from "./auth";

/** Starts development-only HTTP fixtures before the runtime or React tree exists. */
export async function startMockServiceWorker(apiBaseUrl: string) {
  mockAuthSessionStore.restore();
  const worker = setupWorker(...createMockHandlers(apiBaseUrl));
  const apiBase = new URL(apiBaseUrl, window.location.origin);
  const apiPath = apiBase.pathname.endsWith("/") ? apiBase.pathname : apiBase.pathname + "/";
  await worker.start({
    onUnhandledRequest(request, print) {
      const requestUrl = new URL(request.url);
      if (
        requestUrl.origin === apiBase.origin &&
        (requestUrl.pathname === apiBase.pathname || requestUrl.pathname.startsWith(apiPath))
      ) {
        print.error();
      }
    },
  });
  return { loginAssistance: mockLoginAssistance } as const;
}
