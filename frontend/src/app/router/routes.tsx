import {
  appBottomNavigationItems,
  appRouteHierarchyMetadata,
  appNavigationItems,
  appRouteRegistry,
  routeDestination,
} from "./routeRegistry";
import type { AppRouteObject } from "./types/AppRoute";
import { AppRouteLayout } from "./components/AppRouteLayout";
import { RouteError } from "./components/RouteError";
import { RouteScrollContentReady } from "./components/RouteScrollRestoration";
import { AppAuthGate } from "@/app/auth/components/AppAuthGate";
import { AuthenticatedAppShell } from "./components/AuthenticatedAppShell";
import { createAppRouteObjects } from "./routeHierarchy";
import type { AppDrawerMode } from "@/app/shell/appShellConfig";

export function createAppRoutes(options: Readonly<{ initialDrawerMode?: AppDrawerMode }> = {}): AppRouteObject[] {
  return [
    {
      Component: AppRouteLayout,
      ErrorBoundary: RouteError,
      children: [
        {
          Component: RouteScrollContentReady,
          children: createAppRouteObjects(appRouteRegistry, "public", {
            metadata: appRouteHierarchyMetadata,
          }),
        },
        {
          Component: AppAuthGate,
          children: [
            {
              Component: RouteScrollContentReady,
              children: [
                {
                  element: (
                    <AuthenticatedAppShell
                      bottomNavigationItems={appBottomNavigationItems}
                      developmentGuidePath={
                        import.meta.env.DEV ? routeDestination(appRouteRegistry.developmentGuideHome) : undefined
                      }
                      initialDrawerMode={options.initialDrawerMode}
                      navigationItems={appNavigationItems}
                    />
                  ),
                  children: createAppRouteObjects(appRouteRegistry, "authenticated", {
                    metadata: appRouteHierarchyMetadata,
                  }),
                },
              ],
            },
          ],
        },
      ],
    },
  ] satisfies AppRouteObject[];
}
