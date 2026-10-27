import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import { createMemoryRouter, Outlet } from "react-router";

import { createAppRouteObjects, type AppRouteRegistry } from "@/app/router/routeHierarchy";
import {
  HeaderTabsShell,
  WorkspaceActivityDetailsPage,
  WorkspaceActivityPage,
  WorkspaceHomeRedirect,
  WorkspaceLayout,
  WorkspaceOverviewPage,
} from "./HeaderTabsExample";

// In an application, add these records to routeRegistry.tsx.
export const headerTabsRegistry = {
  workspace: {
    Component: WorkspaceLayout,
    access: "authenticated",
    defaultChildId: "workspaceOverview",
    headerNavigation: true,
    path: "/workspace",
    title: t => t("storybook.headerTabs.workspace"),
  },
  workspaceOverview: {
    Component: WorkspaceOverviewPage,
    access: "authenticated",
    navigation: { Icon: DashboardOutlinedIcon, labelKey: "storybook.headerTabs.overview" },
    parentId: "workspace",
    path: "/workspace/overview",
    title: t => t("storybook.headerTabs.overview"),
  },
  workspaceActivity: {
    Component: Outlet,
    access: "authenticated",
    navigation: { Icon: TimelineOutlinedIcon, labelKey: "storybook.headerTabs.activity" },
    parentId: "workspace",
    path: "/workspace/activity",
    title: t => t("storybook.headerTabs.activity"),
  },
  workspaceActivityIndex: {
    Component: WorkspaceActivityPage,
    access: "authenticated",
    index: true,
    parentId: "workspaceActivity",
    title: t => t("storybook.headerTabs.activity"),
  },
  workspaceActivityDetails: {
    Component: WorkspaceActivityDetailsPage,
    access: "authenticated",
    parentId: "workspaceActivity",
    path: "/workspace/activity/details",
    title: t => t("storybook.headerTabs.details"),
  },
} as const satisfies AppRouteRegistry;

/** Story-owned history; it never registers these example URLs in the application. */
export function createHeaderTabsRouter(initialPath: string) {
  return createMemoryRouter(
    [
      {
        Component: HeaderTabsShell,
        children: [
          { Component: WorkspaceHomeRedirect, path: "/" },
          ...createAppRouteObjects(headerTabsRegistry, "authenticated"),
        ],
      },
    ],
    { initialEntries: [initialPath] },
  );
}
