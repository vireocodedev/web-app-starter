import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";

import App from "./app/App";
import type { AppAuthLoginAssistance } from "@/app/auth/types/AppAuthLoginAssistance";
import { loadAppConfig } from "@/app/bootstrap/config/loadAppConfig";
import { initSignalEffects } from "@/app/bootstrap/signals/initSignalEffects";
import { createAppRoutes } from "./app/router/routes";
import { createAppRuntime } from "./app/bootstrap/runtime/createAppRuntime";
import { renderFatalStartupError } from "@/app/bootstrap/failure/renderFatalStartupError";
import { reportStartupFailure } from "@/app/bootstrap/failure/reportStartupFailure";

const rootElement = document.getElementById("root");
let disposeSignalEffects: (() => void) | undefined;

try {
  const config = loadAppConfig(import.meta.env, {
    isProductionBuild: import.meta.env.PROD,
  });
  let loginAssistance: AppAuthLoginAssistance | undefined;
  if (import.meta.env.DEV && config.VITE_API_MODE === "mock") {
    const { startMockServiceWorker } = await import("@mocks/browser");
    const mockSetup = await startMockServiceWorker(config.VITE_API_BASE_URL);
    loginAssistance = mockSetup.loginAssistance;
  }
  const initializedSignalEffects = initSignalEffects();
  disposeSignalEffects = initializedSignalEffects;
  if (import.meta.hot) import.meta.hot.dispose(initializedSignalEffects);

  const runtime = createAppRuntime(config, {
    loginAssistance,
  });
  const router = createBrowserRouter(createAppRoutes());

  createRoot(rootElement!).render(
    <StrictMode>
      <App router={router} runtime={runtime} />
    </StrictMode>,
  );
} catch (error) {
  reportStartupFailure(error, { isDevelopment: import.meta.env.DEV });
  disposeSignalEffects?.();
  renderFatalStartupError(rootElement);
}
