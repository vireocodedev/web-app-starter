import { createMemoryRouter, Outlet } from "react-router";

import { createAppRouteObjects, type AppRouteRegistry } from "@/app/router/routeHierarchy";
import {
  NavigationChooserShell,
  ToolsActivityPage,
  ToolsChooserPage,
  ToolsGettingStartedPage,
  ToolsHomeRedirect,
  ToolsMembersPage,
} from "./NavigationChooserExample";

// The index renders the chooser at /tools; each choice is an ordinary child route.
export const navigationChooserRegistry = {
  tools: {
    Component: Outlet,
    access: "authenticated",
    contentMaxWidth: "xl",
    path: "/tools",
    title: () => "Tools",
  },
  toolsIndex: {
    Component: ToolsChooserPage,
    access: "authenticated",
    index: true,
    parentId: "tools",
    title: () => "Tools",
  },
  toolsGettingStarted: {
    Component: ToolsGettingStartedPage,
    access: "authenticated",
    parentId: "tools",
    path: "/tools/getting-started",
    title: () => "Getting started",
  },
  toolsMembers: {
    Component: ToolsMembersPage,
    access: "authenticated",
    parentId: "tools",
    path: "/tools/members",
    title: () => "Members",
  },
  toolsActivity: {
    Component: ToolsActivityPage,
    access: "authenticated",
    parentId: "tools",
    path: "/tools/activity",
    title: () => "Activity",
  },
} as const satisfies AppRouteRegistry;

/** Story-only history and a home target for the preview shell's brand link. */
export function createNavigationChooserRouter(initialPath: string) {
  return createMemoryRouter(
    [
      {
        Component: NavigationChooserShell,
        children: [
          { Component: ToolsHomeRedirect, path: "/" },
          ...createAppRouteObjects(navigationChooserRegistry, "authenticated"),
        ],
      },
    ],
    { initialEntries: [initialPath] },
  );
}
