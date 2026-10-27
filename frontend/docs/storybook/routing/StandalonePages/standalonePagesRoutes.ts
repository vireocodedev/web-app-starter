import { createMemoryRouter } from "react-router";

import { createAppRouteObjects, type AppRouteRegistry } from "@/app/router/routeHierarchy";
import { ReportsPage, StandaloneHomeRedirect, StandalonePagesShell, SupportPage } from "./StandalonePagesExample";

// In an application, add these independent records to routeRegistry.tsx and localize titles.
export const standalonePagesRegistry = {
  reports: {
    Component: ReportsPage,
    access: "authenticated",
    contentMaxWidth: "md",
    path: "/reports",
    title: () => "Reports",
  },
  support: {
    Component: SupportPage,
    access: "authenticated",
    contentMaxWidth: "md",
    path: "/support",
    title: () => "Support",
  },
} as const satisfies AppRouteRegistry;

/** Story-only history and a home target for the preview shell's brand link. */
export function createStandalonePagesRouter(initialPath: string) {
  return createMemoryRouter(
    [
      {
        Component: StandalonePagesShell,
        children: [
          { Component: StandaloneHomeRedirect, path: "/" },
          ...createAppRouteObjects(standalonePagesRegistry, "authenticated"),
        ],
      },
    ],
    { initialEntries: [initialPath] },
  );
}
