import { createElement } from "react";
import { createMemoryRouter, Outlet } from "react-router";

import { createAppRouteObjects, type AppRouteRegistry } from "@/app/router/routeHierarchy";
import {
  LeftNavigationShell,
  ProjectActivityPage,
  ProjectHomeRedirect,
  ProjectLayout,
  ProjectMemberDetailsPage,
  ProjectMembersPage,
  ProjectOverviewPage,
} from "./LeftNavigationExample";

// In an application, add these records to routeRegistry.tsx and localize the titles.
export const leftNavigationRegistry = {
  project: {
    Component: ProjectLayout,
    access: "authenticated",
    defaultChildId: "projectOverview",
    path: "/project",
    title: () => "Project",
  },
  projectOverview: {
    Component: ProjectOverviewPage,
    access: "authenticated",
    mobileSurface: "flush",
    parentId: "project",
    path: "/project/overview",
    title: () => "Overview",
  },
  projectMembers: {
    Component: Outlet,
    access: "authenticated",
    parentId: "project",
    path: "/project/members",
    title: () => "Members",
  },
  projectMembersIndex: {
    Component: ProjectMembersPage,
    access: "authenticated",
    index: true,
    mobileSurface: "flush",
    parentId: "projectMembers",
    title: () => "Members",
  },
  projectMemberDetails: {
    Component: ProjectMemberDetailsPage,
    access: "authenticated",
    mobileSurface: "flush",
    parentId: "projectMembers",
    path: "/project/members/details",
    title: () => "Member details",
  },
  projectActivity: {
    Component: ProjectActivityPage,
    access: "authenticated",
    mobileSurface: "flush",
    parentId: "project",
    path: "/project/activity",
    title: () => "Activity",
  },
} as const satisfies AppRouteRegistry;

/** Isolated history and a width override belong only to the Storybook fixture. */
export function createLeftNavigationRouter(initialPath: string, maxWidth = 1280) {
  const registry = {
    ...leftNavigationRegistry,
    project: {
      ...leftNavigationRegistry.project,
      Component: function PreviewProjectLayout() {
        return createElement(ProjectLayout, { maxWidth });
      },
    },
  };
  return createMemoryRouter(
    [
      {
        Component: LeftNavigationShell,
        children: [{ Component: ProjectHomeRedirect, path: "/" }, ...createAppRouteObjects(registry, "authenticated")],
      },
    ],
    { initialEntries: [initialPath] },
  );
}
