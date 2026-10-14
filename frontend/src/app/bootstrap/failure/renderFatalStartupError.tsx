import { createRoot } from "react-dom/client";

import { FatalErrorScreen } from "./FatalErrorScreen";

/**
 * Call from main.tsx when application initialization failed before React's
 * render boundary could exist. Deliberately accepts no raw Error: local
 * diagnostics belong to reportStartupFailure and production telemetry to a
 * separately sanitized adapter.
 */
export function renderFatalStartupError(rootElement: Element | null) {
  if (!(rootElement instanceof HTMLElement)) return;

  const root = createRoot(rootElement);
  root.render(<FatalErrorScreen />);
  return root;
}
