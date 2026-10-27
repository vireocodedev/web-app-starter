import { render, screen } from "@testing-library/react";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import type { TFunction } from "i18next";
import type { AppRouteTranslations } from "@/app/router/types/AppRoute";
import { Outlet, RouterProvider, createMemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import {
  createAppRouteObjects,
  directChildRouteIdForDestination,
  routeDestinationFromRegistry,
  validateAppRouteRegistry,
  type AppRouteRegistry,
} from "@/app/router/routeHierarchy";

const translate = ((key: string) => key) as unknown as TFunction<"translation">;
const translations: AppRouteTranslations = { app: translate };

function EmptyPage() {
  return null;
}

function WorkspaceLayout() {
  return (
    <main>
      <h1>Workspace</h1>
      <Outlet />
    </main>
  );
}

function RootLayout() {
  return (
    <main>
      <h1>Root layout</h1>
      <Outlet />
    </main>
  );
}

function ActivityLayout() {
  return (
    <section>
      <h2>Activity</h2>
      <Outlet />
    </section>
  );
}

function OverviewPage() {
  return <p>Overview page</p>;
}

function ActivityDetailsPage() {
  return <p>Activity details page</p>;
}

const workspaceRegistry = {
  workspace: {
    Component: WorkspaceLayout,
    access: "authenticated",
    defaultChildId: "workspaceOverview",
    path: "/workspace",
    title: () => "Workspace",
  },
  workspaceOverview: {
    Component: OverviewPage,
    access: "authenticated",
    parentId: "workspace",
    path: "/workspace/overview",
    title: () => "Overview",
  },
  workspaceActivity: {
    Component: ActivityLayout,
    access: "authenticated",
    parentId: "workspace",
    path: "/workspace/activity",
    title: () => "Activity",
  },
  workspaceActivityDetails: {
    Component: ActivityDetailsPage,
    access: "authenticated",
    breadcrumbs: [
      {
        title: () => "Filtered",
        to: () => "/workspace/activity/details?filter=recent",
      },
    ],
    parentId: "workspaceActivity",
    path: "/workspace/activity/details",
    scrollToTop: true,
    title: () => "Details",
  },
} as const satisfies AppRouteRegistry;

function renderRegistry(registry: AppRouteRegistry, initialEntry: string) {
  const router = createMemoryRouter(
    createAppRouteObjects(registry, "authenticated", {
      isDevelopment: true,
    }),
    { initialEntries: [initialEntry] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("application route hierarchy", () => {
  it("exposes only explicit header breadcrumb metadata on each matched route handle", () => {
    const registry = {
      workspace: {
        Component: WorkspaceLayout,
        access: "authenticated",
        path: "/workspace",
        title: () => "Workspace",
      },
      activity: {
        Component: ActivityLayout,
        access: "authenticated",
        headerBreadcrumb: true,
        parentId: "workspace",
        path: "/workspace/activity",
        title: () => "Activity",
      },
      details: {
        Component: ActivityDetailsPage,
        access: "authenticated",
        parentId: "activity",
        path: "/workspace/activity/details",
        title: () => "Details",
      },
    } as const satisfies AppRouteRegistry;
    const workspace = createAppRouteObjects(registry, "authenticated")[0];
    expect(workspace?.handle?.headerBreadcrumb).toBeUndefined();
    expect(workspace?.children?.[0]?.handle?.headerBreadcrumb).toBe(true);
    expect(workspace?.children?.[0]?.children?.[0]?.handle?.headerBreadcrumb).toBeUndefined();
  });

  it("passes each route's mobile presentation choices to its own handle", () => {
    const registry = {
      workspace: {
        Component: WorkspaceLayout,
        access: "authenticated",
        mobileBottomNavigation: false,
        mobileSurface: "flush",
        path: "/workspace",
        title: () => "Workspace",
      },
      defaultVisible: {
        Component: OverviewPage,
        access: "authenticated",
        parentId: "workspace",
        path: "/workspace/default",
        title: () => "Default",
      },
      visible: {
        Component: OverviewPage,
        access: "authenticated",
        mobileBottomNavigation: true,
        mobileSurface: "inset",
        parentId: "workspace",
        path: "/workspace/visible",
        title: () => "Visible",
      },
      hidden: {
        Component: OverviewPage,
        access: "authenticated",
        mobileBottomNavigation: false,
        mobileSurface: "flush",
        parentId: "workspace",
        path: "/workspace/hidden",
        title: () => "Hidden",
      },
    } as const satisfies AppRouteRegistry;
    const [parent] = createAppRouteObjects(registry, "authenticated");
    expect(parent?.handle?.mobileBottomNavigation).toBe(false);
    expect(parent?.handle?.mobileSurface).toBe("flush");
    expect(parent?.children?.find(child => child.path === "default")?.handle).toMatchObject({
      mobileBottomNavigation: undefined,
      mobileSurface: undefined,
    });
    expect(parent?.children?.find(child => child.path === "visible")?.handle).toMatchObject({
      mobileBottomNavigation: true,
      mobileSurface: "inset",
    });
    expect(parent?.children?.find(child => child.path === "hidden")?.handle).toMatchObject({
      mobileBottomNavigation: false,
      mobileSurface: "flush",
    });
  });

  it("omits disabled direct children from both routes and section tabs", () => {
    const registry = {
      workspace: {
        Component: WorkspaceLayout,
        access: "authenticated",
        headerNavigation: true,
        path: "/workspace",
        title: () => "Workspace",
      },
      main: {
        Component: EmptyPage,
        access: "authenticated",
        navigation: { Icon: HomeOutlinedIcon, labelKey: "navigation.home" },
        parentId: "workspace",
        path: "/workspace/main",
        title: () => "Main",
      },
      diagnostics: {
        Component: EmptyPage,
        access: "authenticated",
        developmentOnly: true,
        navigation: { Icon: HomeOutlinedIcon, labelKey: "navigation.settings" },
        parentId: "workspace",
        path: "/workspace/diagnostics",
        title: () => "Diagnostics",
      },
    } as const satisfies AppRouteRegistry;

    const [production] = createAppRouteObjects(registry, "authenticated", { isDevelopment: false });
    expect(production?.children?.map(child => child.path)).toEqual(["main"]);
    expect(production?.handle?.sectionNavigation).toMatchObject([
      { labelKey: "navigation.home", to: "/workspace/main" },
    ]);

    const [development] = createAppRouteObjects(registry, "authenticated", { isDevelopment: true });
    expect(development?.children?.map(child => child.path)).toEqual(["main", "diagnostics"]);
    expect(development?.handle?.sectionNavigation).toMatchObject([
      { labelKey: "navigation.home", to: "/workspace/main" },
      { labelKey: "navigation.settings", to: "/workspace/diagnostics" },
    ]);
  });

  it("renders a parent layout and direct child from registry records only", async () => {
    renderRegistry(workspaceRegistry, "/workspace/overview");

    expect(await screen.findByRole("heading", { name: "Workspace" })).toBeVisible();
    expect(screen.getByText("Overview page")).toBeVisible();
  });

  it("derives a relative child path below a path-bearing root parent", async () => {
    const registry = {
      root: {
        Component: RootLayout,
        access: "authenticated",
        path: "/",
        title: () => "Root",
      },
      workspace: {
        Component: OverviewPage,
        access: "authenticated",
        parentId: "root",
        path: "/workspace",
        title: () => "Workspace",
      },
    } as const satisfies AppRouteRegistry;

    renderRegistry(registry, "/workspace");

    expect(await screen.findByRole("heading", { name: "Root layout" })).toBeVisible();
    expect(screen.getByText("Overview page")).toBeVisible();

    const rootRoute = createAppRouteObjects(registry, "authenticated", {
      isDevelopment: true,
    })[0];
    expect(rootRoute?.children?.[0]?.path).toBe("workspace");
  });

  it("replaces a parent URL with its configured default child", async () => {
    const router = renderRegistry(workspaceRegistry, "/workspace");

    expect(await screen.findByText("Overview page")).toBeVisible();
    expect(router.state.location.pathname).toBe("/workspace/overview");
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it.each(["Workspace", "Overview"])(
    "supports a nested %s index and deduplicates only identical parent titles",
    async indexTitle => {
      const registry = {
        workspace: {
          Component: WorkspaceLayout,
          access: "authenticated",
          path: "/workspace",
          title: () => "Workspace",
        },
        workspaceIndex: {
          Component: OverviewPage,
          access: "authenticated",
          index: true,
          parentId: "workspace",
          title: () => indexTitle,
        },
      } as const satisfies AppRouteRegistry;

      const router = renderRegistry(registry, "/workspace");

      expect(await screen.findByText("Overview page")).toBeVisible();
      expect(router.state.location.pathname).toBe("/workspace");
      expect(routeDestinationFromRegistry(registry, "workspaceIndex")).toBe("/workspace");
      const index = createAppRouteObjects(registry, "authenticated")[0]?.children?.find(route => route.index);
      expect(index?.handle?.resolveBreadcrumbs(translations, {})).toEqual(
        indexTitle === "Workspace"
          ? [{ label: "Workspace" }]
          : [{ label: "Workspace", to: "/workspace" }, { label: "Overview" }],
      );
    },
  );

  it("leaves a parent layout at its own URL when no default is configured", async () => {
    const registry = {
      workspace: {
        Component: WorkspaceLayout,
        access: "authenticated",
        path: "/workspace",
        title: () => "Workspace",
      },
      workspaceOverview: {
        Component: OverviewPage,
        access: "authenticated",
        parentId: "workspace",
        path: "/workspace/overview",
        title: () => "Overview",
      },
    } as const satisfies AppRouteRegistry;

    const router = renderRegistry(registry, "/workspace");

    expect(await screen.findByRole("heading", { name: "Workspace" })).toBeVisible();
    expect(screen.queryByText("Overview page")).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/workspace");
  });

  it("composes arbitrary depth with full ancestor breadcrumbs and deepest metadata", () => {
    const workspace = createAppRouteObjects(workspaceRegistry, "authenticated", { isDevelopment: true })[0];
    const activity = workspace?.children?.find(route => route.path === "activity");
    const details = activity?.children?.find(route => route.path === "details");
    if (!details?.handle) throw new Error("Expected nested details route");

    expect(details.handle.scrollToTop).toBe(true);
    expect(details.handle.resolveBreadcrumbs(translations, {})).toEqual([
      { label: "Workspace", to: "/workspace" },
      { label: "Activity", to: "/workspace/activity" },
      {
        label: "Filtered",
        to: "/workspace/activity/details?filter=recent",
      },
      { label: "Details" },
    ]);
  });

  it("resolves dynamic ancestor breadcrumbs from current route parameters", () => {
    const registry = {
      projects: {
        Component: WorkspaceLayout,
        access: "authenticated",
        path: "/projects/:projectId",
        title: (_t, params) => `Project ${params.projectId}`,
      },
      projectSettings: {
        Component: EmptyPage,
        access: "authenticated",
        parentId: "projects",
        path: "/projects/:projectId/settings",
        title: () => "Settings",
      },
    } as const satisfies AppRouteRegistry;
    const project = createAppRouteObjects(registry, "authenticated", { isDevelopment: true })[0];
    const settings = project?.children?.find(route => route.path === "settings");
    if (!settings?.handle) throw new Error("Expected project settings route");

    expect(
      settings.handle.resolveBreadcrumbs(translations, {
        projectId: "RGO / 1",
      }),
    ).toEqual([{ label: "Project RGO / 1", to: "/projects/RGO%20%2F%201" }, { label: "Settings" }]);
  });

  it("omits absent optional segments and preserves encoded splat separators", () => {
    const optionalRegistry = {
      teams: {
        Component: WorkspaceLayout,
        access: "authenticated",
        path: "/teams/:teamId?",
        title: () => "Teams",
      },
      teamSettings: {
        Component: EmptyPage,
        access: "authenticated",
        parentId: "teams",
        path: "/teams/:teamId?/settings",
        title: () => "Settings",
      },
    } as const satisfies AppRouteRegistry;
    const optionalParent = createAppRouteObjects(optionalRegistry, "authenticated", { isDevelopment: true })[0];
    const optionalChild = optionalParent?.children?.find(route => route.path === "settings");
    if (!optionalChild?.handle) throw new Error("Expected optional settings route");
    expect(optionalChild.handle.resolveBreadcrumbs(translations, {})).toEqual([
      { label: "Teams", to: "/teams" },
      { label: "Settings" },
    ]);

    const splatRegistry = {
      files: {
        Component: WorkspaceLayout,
        access: "authenticated",
        path: "/files/*",
        title: () => "Files",
      },
      fileIndex: {
        Component: EmptyPage,
        access: "authenticated",
        index: true,
        parentId: "files",
        title: () => "Selected file",
      },
    } as const satisfies AppRouteRegistry;
    const splatParent = createAppRouteObjects(splatRegistry, "authenticated", { isDevelopment: true })[0];
    const splatChild = splatParent?.children?.find(route => route.index);
    if (!splatChild?.handle) throw new Error("Expected splat index route");
    expect(
      splatChild.handle.resolveBreadcrumbs(translations, {
        "*": "folder one/report#1",
      }),
    ).toEqual([{ label: "Files", to: "/files/folder%20one/report%231" }, { label: "Selected file" }]);
  });

  it("leaves an ancestor breadcrumb unlinked when a required parameter is missing", () => {
    const registry = {
      projects: {
        Component: WorkspaceLayout,
        access: "authenticated",
        path: "/projects/:projectId",
        title: () => "Project",
      },
      projectSettings: {
        Component: EmptyPage,
        access: "authenticated",
        parentId: "projects",
        path: "/projects/:projectId/settings",
        title: () => "Settings",
      },
    } as const satisfies AppRouteRegistry;
    const project = createAppRouteObjects(registry, "authenticated", { isDevelopment: true })[0];
    const settings = project?.children?.find(route => route.path === "settings");
    if (!settings?.handle) throw new Error("Expected project settings route");

    expect(settings.handle.resolveBreadcrumbs(translations, {})).toEqual([
      { label: "Project", to: undefined },
      { label: "Settings" },
    ]);
  });

  it("renders a further nesting level through every parent Outlet", async () => {
    renderRegistry(workspaceRegistry, "/workspace/activity/details");

    expect(await screen.findByRole("heading", { name: "Workspace" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Activity" })).toBeVisible();
    expect(screen.getByText("Activity details page")).toBeVisible();
  });

  it("inherits development-only exclusion through every ancestor", () => {
    const registry = {
      workspace: {
        Component: EmptyPage,
        access: "authenticated",
        developmentOnly: true,
        path: "/workspace",
        title: () => "Workspace",
      },
      activity: {
        Component: EmptyPage,
        access: "authenticated",
        parentId: "workspace",
        path: "/workspace/activity",
        title: () => "Activity",
      },
      details: {
        Component: EmptyPage,
        access: "authenticated",
        parentId: "activity",
        path: "/workspace/activity/details",
        title: () => "Details",
      },
    } as const satisfies AppRouteRegistry;

    expect(
      createAppRouteObjects(registry, "authenticated", {
        isDevelopment: false,
      }),
    ).toEqual([]);
  });

  it.each([
    {
      expected: 'Route "child" references unknown parent "missing"',
      registry: {
        child: {
          Component: EmptyPage,
          access: "authenticated",
          parentId: "missing",
          path: "/missing/child",
          title: (): string => "Child",
        },
      },
    },
    {
      expected: "forms a parent cycle: first -> second -> first",
      registry: {
        first: {
          Component: EmptyPage,
          access: "authenticated",
          index: true,
          parentId: "second",
          title: (): string => "First",
        },
        second: {
          Component: EmptyPage,
          access: "authenticated",
          index: true,
          parentId: "first",
          title: (): string => "Second",
        },
      },
    },
    {
      expected: 'Route "child" path "/other/child" must be below parent "parent"',
      registry: {
        parent: {
          Component: EmptyPage,
          access: "authenticated",
          path: "/parent",
          title: (): string => "Parent",
        },
        child: {
          Component: EmptyPage,
          access: "authenticated",
          parentId: "parent",
          path: "/other/child",
          title: (): string => "Child",
        },
      },
    },
    {
      expected: 'Route "child" uses access "public" but parent "parent" uses "authenticated"',
      registry: {
        parent: {
          Component: EmptyPage,
          access: "authenticated",
          path: "/parent",
          title: (): string => "Parent",
        },
        child: {
          Component: EmptyPage,
          access: "public",
          parentId: "parent",
          path: "/parent/child",
          title: (): string => "Child",
        },
      },
    },
    {
      expected: 'Route "parent" has multiple index children: first, second',
      registry: {
        parent: {
          Component: EmptyPage,
          access: "authenticated",
          path: "/parent",
          title: (): string => "Parent",
        },
        first: {
          Component: EmptyPage,
          access: "authenticated",
          index: true,
          parentId: "parent",
          title: (): string => "First",
        },
        second: {
          Component: EmptyPage,
          access: "authenticated",
          index: true,
          parentId: "parent",
          title: (): string => "Second",
        },
      },
    },
    {
      expected: 'Route "parent" cannot use default child "child" with index child "child"',
      registry: {
        parent: {
          Component: EmptyPage,
          access: "authenticated",
          defaultChildId: "child",
          path: "/parent",
          title: (): string => "Parent",
        },
        child: {
          Component: EmptyPage,
          access: "authenticated",
          index: true,
          parentId: "parent",
          title: (): string => "Child",
        },
      },
    },
    {
      expected: 'Route "parent" default child "grandchild" must be a direct child',
      registry: {
        parent: {
          Component: EmptyPage,
          access: "authenticated",
          defaultChildId: "grandchild",
          path: "/parent",
          title: (): string => "Parent",
        },
        child: {
          Component: EmptyPage,
          access: "authenticated",
          parentId: "parent",
          path: "/parent/child",
          title: (): string => "Child",
        },
        grandchild: {
          Component: EmptyPage,
          access: "authenticated",
          parentId: "child",
          path: "/parent/child/grandchild",
          title: (): string => "Grandchild",
        },
      },
    },
    {
      expected: 'has unresolved destination "/parent/:childId"',
      registry: {
        parent: {
          Component: EmptyPage,
          access: "authenticated",
          defaultChildId: "child",
          path: "/parent",
          title: (): string => "Parent",
        },
        child: {
          Component: EmptyPage,
          access: "authenticated",
          parentId: "parent",
          path: "/parent/:childId",
          title: (): string => "Child",
        },
      },
    },
  ])("rejects invalid hierarchy: $expected", ({ expected, registry }) => {
    expect(() =>
      validateAppRouteRegistry(registry as unknown as AppRouteRegistry, {
        isDevelopment: true,
      }),
    ).toThrow(expected);
  });

  it("validates the complete registry before filtering for one access class", () => {
    const registry = {
      workspace: {
        Component: EmptyPage,
        access: "authenticated",
        path: "/workspace",
        title: () => "Workspace",
      },
      brokenPublicRoute: {
        Component: EmptyPage,
        access: "public",
        parentId: "unknownPublicParent",
        path: "/public/broken",
        title: () => "Broken",
      },
    } as const satisfies AppRouteRegistry;

    expect(() =>
      createAppRouteObjects(registry, "authenticated", {
        isDevelopment: true,
      }),
    ).toThrow('Route "brokenPublicRoute" references unknown parent "unknownPublicParent"');
  });

  it("derives a navigation default from direct children without traversing unvalidated ancestry", () => {
    const registry = {
      cyclicFirst: {
        Component: EmptyPage,
        access: "authenticated",
        index: true,
        navigation: {
          Icon: HomeOutlinedIcon,
          labelKey: "navigation.home",
        },
        parentId: "cyclicSecond",
        title: () => "First",
      },
      cyclicSecond: {
        Component: EmptyPage,
        access: "authenticated",
        index: true,
        navigation: {
          Icon: HomeOutlinedIcon,
          labelKey: "navigation.home",
        },
        parentId: "cyclicFirst",
        title: () => "Second",
      },
      examples: {
        Component: EmptyPage,
        access: "authenticated",
        path: "/workspace/patterns",
        title: () => "Patterns",
      },
      firstPattern: {
        Component: EmptyPage,
        access: "authenticated",
        parentId: "examples",
        path: "/workspace/patterns/first",
        title: () => "First pattern",
      },
    } as const satisfies AppRouteRegistry;

    expect(directChildRouteIdForDestination(registry, "examples", "/workspace/patterns/first")).toBe("firstPattern");
    expect(() => routeDestinationFromRegistry(registry, "cyclicFirst")).toThrow(
      'Route "cyclicFirst" forms a destination parent cycle: cyclicFirst -> cyclicSecond -> cyclicFirst',
    );
  });

  it("rejects a default child excluded from an enabled production parent", () => {
    const registry = {
      workspace: {
        Component: EmptyPage,
        access: "authenticated",
        defaultChildId: "overview",
        path: "/workspace",
        title: () => "Workspace",
      },
      overview: {
        Component: EmptyPage,
        access: "authenticated",
        developmentOnly: true,
        parentId: "workspace",
        path: "/workspace/overview",
        title: () => "Overview",
      },
    } as const satisfies AppRouteRegistry;

    expect(() => validateAppRouteRegistry(registry, { isDevelopment: false })).toThrow(
      'Route "workspace" default child "overview" is not enabled',
    );
  });
});
