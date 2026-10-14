import { RouterProvider } from "react-router";
import type { DataRouter } from "react-router";

import type { AppRuntime } from "./bootstrap/runtime/createAppRuntime";
import { AppProviders } from "./bootstrap/runtime/AppProviders";
import { AppRenderErrorBoundary } from "@/app/bootstrap/failure/AppRenderErrorBoundary";

export default function App({ router, runtime }: { router: DataRouter; runtime: AppRuntime }) {
  return (
    <AppRenderErrorBoundary>
      <AppProviders runtime={runtime}>
        <RouterProvider router={router} />
      </AppProviders>
    </AppRenderErrorBoundary>
  );
}
