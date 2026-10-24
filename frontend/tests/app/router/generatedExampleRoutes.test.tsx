import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { render, screen } from "@testing-library/react";
import { Outlet, RouterProvider, createMemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { createGeneratedExampleRoutes } from "@/app/router/generatedExampleRoutes";
import { createAppRouteObjects } from "@/app/router/routeHierarchy";
import type { AppNavigationLink, AppRouteDefinition } from "@/app/router/types/AppRoute";

type NavigationModule = NonNullable<Parameters<typeof createGeneratedExampleRoutes>[1]>[string];
const navigationFile = "./generated/projects--project-hub.routes.tsx";
const navigationId = "generated-example:navigation:projects:project-hub";
const navigationPath = "dev-guide/frontend/generated/navigation/projects--project-hub";

function Overview() {
  return <p>Generated overview content</p>;
}
function RecordDetails() {
  return <p>Generated record details</p>;
}

const navigationModule: NavigationModule = {
  createRoutes: mount => ({
    [mount.idPrefix]: {
      Component: Outlet,
      access: "authenticated",
      defaultChildId: `${mount.idPrefix}:overview`,
      developmentOnly: mount.developmentOnly,
      headerNavigation: true,
      parentId: mount.parentId,
      path: mount.path,
      title: () => "Project hub",
    },
    [`${mount.idPrefix}:overview`]: {
      Component: Overview,
      access: "authenticated",
      navigation: { Icon: HomeOutlinedIcon, labelKey: "navigation.home" },
      parentId: mount.idPrefix,
      path: `${mount.path}/overview`,
      title: () => "Overview",
    },
    [`${mount.idPrefix}:workspace`]: {
      Component: Outlet,
      access: "authenticated",
      defaultChildId: `${mount.idPrefix}:records`,
      navigation: { Icon: HomeOutlinedIcon, labelKey: "navigation.home" },
      parentId: mount.idPrefix,
      path: `${mount.path}/workspace`,
      title: () => "Workspace",
    },
    [`${mount.idPrefix}:settings`]: {
      Component: Overview,
      access: "authenticated",
      navigation: { Icon: HomeOutlinedIcon, labelKey: "navigation.settings" },
      parentId: mount.idPrefix,
      path: `${mount.path}/settings`,
      title: () => "Settings",
    },
    [`${mount.idPrefix}:records`]: {
      Component: Outlet,
      access: "authenticated",
      parentId: `${mount.idPrefix}:workspace`,
      path: `${mount.path}/workspace/records`,
      title: () => "Records",
    },
    [`${mount.idPrefix}:recordsIndex`]: {
      Component: Overview,
      access: "authenticated",
      index: true,
      parentId: `${mount.idPrefix}:records`,
      title: () => "Records",
    },
    [`${mount.idPrefix}:details`]: {
      Component: RecordDetails,
      access: "authenticated",
      parentId: `${mount.idPrefix}:records`,
      path: `${mount.path}/workspace/records/details`,
      title: () => "Record details",
    },
    [`${mount.idPrefix}:activity`]: {
      Component: Overview,
      access: "authenticated",
      parentId: `${mount.idPrefix}:workspace`,
      path: `${mount.path}/workspace/activity`,
      title: () => "Activity",
    },
  }),
};

/** Deliberately invalid JS factory output crosses the typed production boundary only here. */
function changeRuntimeRoute(
  routes: Record<string, AppRouteDefinition>,
  id: string,
  changes: Readonly<Record<string, unknown>>,
): void {
  routes[id] = { ...routes[id], ...changes } as unknown as AppRouteDefinition;
}

function discoveryRegistry(): Record<string, AppRouteDefinition> {
  return {
    developmentGuideFrontend: {
      Component: Outlet,
      access: "authenticated",
      path: "dev-guide/frontend",
      title: () => "Frontend",
    } as const,
    ...createGeneratedExampleRoutes({}, { [navigationFile]: navigationModule }),
  };
}

describe("generated example route discovery", () => {
  const loader = async () => ({ Component: () => null });
  it("derives lazy authenticated child routes and removes absent registrations", () => {
    const file = "../../pages/development-guide/generated/form/profile--profile.example.tsx";
    const routes = createGeneratedExampleRoutes({ [file]: loader });
    expect(routes["generated-example:form:profile:profile"]).toMatchObject({
      path: "dev-guide/frontend/generated/form/profile--profile",
      access: "authenticated",
      developmentOnly: true,
      parentId: "generatedExamples",
      lazy: loader,
    });
    expect(createGeneratedExampleRoutes({})["generated-example:form:profile:profile"]).toBeUndefined();
  });
  it("rejects malformed or duplicate route identities", () => {
    expect(() => createGeneratedExampleRoutes({ "bad.example.tsx": loader })).toThrow(/Invalid/);
    expect(() =>
      createGeneratedExampleRoutes({
        "a/generated/form/a--b.example.tsx": loader,
        "b/generated/form/a--b.example.tsx": loader,
      }),
    ).toThrow(/Duplicate/);
  });
});

describe("generated navigation route discovery", () => {
  it("passes a stable isolated mount and retains nested route/tab metadata", () => {
    const createRoutes = vi.fn(navigationModule.createRoutes);
    const routes = createGeneratedExampleRoutes({}, { [navigationFile]: { createRoutes } });
    expect(createRoutes).toHaveBeenCalledWith({
      idPrefix: navigationId,
      path: navigationPath,
      parentId: "generatedExamples",
      developmentOnly: true,
    });
    expect(routes[navigationId]).toMatchObject({
      path: navigationPath,
      access: "authenticated",
      developmentOnly: true,
      parentId: "generatedExamples",
      headerNavigation: true,
      defaultChildId: `${navigationId}:overview`,
    });
    const frontend = createAppRouteObjects(discoveryRegistry(), "authenticated", { isDevelopment: true })[0];
    const generated = frontend?.children?.find(route => route.path === "generated");
    const root = generated?.children?.find(route => route.path === "navigation/projects--project-hub");
    expect(root?.handle?.sectionNavigation?.map((tab: AppNavigationLink) => tab.to)).toEqual([
      `/${navigationPath}/overview`,
      `/${navigationPath}/workspace`,
      `/${navigationPath}/settings`,
    ]);
    const workspace = root?.children?.find(route => route.path === "workspace");
    const records = workspace?.children?.find(route => route.path === "records");
    expect(records?.children?.some(route => route.index)).toBe(true);
    expect(records?.children?.find(route => route.path === "details")?.Component).toBe(RecordDetails);
    expect(workspace?.children?.some(route => route.path === "activity")).toBe(true);
    expect(createGeneratedExampleRoutes({})[navigationId]).toBeUndefined();
  });

  it.each([
    { suffix: "", destination: "overview" },
    { suffix: "/workspace", destination: "workspace/records" },
  ])("uses the existing replacement redirect for $suffix", async ({ suffix, destination }) => {
    const router = createMemoryRouter(
      createAppRouteObjects(discoveryRegistry(), "authenticated", { isDevelopment: true }),
      { initialEntries: [`/${navigationPath}${suffix}`] },
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByText("Generated overview content")).toBeVisible();
    expect(router.state.location.pathname).toBe(`/${navigationPath}/${destination}`);
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("inherits DEV exclusion for descendants without their own developmentOnly flag", () => {
    const routes = discoveryRegistry();
    expect(routes[`${navigationId}:details`]?.developmentOnly).toBeUndefined();
    const frontend = createAppRouteObjects(routes, "authenticated", { isDevelopment: false })[0];
    expect(frontend?.children).toBeUndefined();
    expect(createAppRouteObjects(routes, "public", { isDevelopment: true })).toEqual([]);
  });

  it("rejects malformed filenames, missing factories and duplicate mounted identities", () => {
    for (const file of [
      "bad.routes.tsx",
      "./generated/projects--Bad.routes.tsx",
      "./generated/projects--hub.extra.routes.tsx",
    ]) {
      expect(() => createGeneratedExampleRoutes({}, { [file]: navigationModule })).toThrow(/Invalid/);
    }
    expect(() => createGeneratedExampleRoutes({}, { [navigationFile]: {} as NavigationModule })).toThrow(/Invalid/);
    expect(() =>
      createGeneratedExampleRoutes(
        {},
        {
          [navigationFile]: navigationModule,
          "another/generated/projects--project-hub.routes.tsx": navigationModule,
        },
      ),
    ).toThrow(/Duplicate/);
  });

  const invalidCases: readonly { label: string; change: (routes: Record<string, AppRouteDefinition>) => void }[] = [
    {
      label: "container replacement",
      change: routes => {
        routes.generatedExamples = routes[navigationId]!;
      },
    },
    {
      label: "foreign leaf identity",
      change: routes => {
        routes["generated-example:form:profile:profile"] = routes[navigationId]!;
      },
    },
    {
      label: "root parent",
      change: routes => {
        changeRuntimeRoute(routes, navigationId, { parentId: "developmentGuideFrontend" });
      },
    },
    {
      label: "root mount",
      change: routes => {
        changeRuntimeRoute(routes, navigationId, { path: "elsewhere" });
      },
    },
    {
      label: "root DEV flag",
      change: routes => {
        changeRuntimeRoute(routes, navigationId, { developmentOnly: undefined });
      },
    },
    {
      label: "public descendant",
      change: routes => {
        changeRuntimeRoute(routes, `${navigationId}:details`, { access: "public" });
      },
    },
    {
      label: "foreign descendant parent",
      change: routes => {
        changeRuntimeRoute(routes, `${navigationId}:details`, { parentId: "generatedExamples" });
      },
    },
    {
      label: "escaped descendant",
      change: routes => {
        changeRuntimeRoute(routes, `${navigationId}:details`, { path: `${navigationPath}/../escape` });
      },
    },
    {
      label: "escaped navigation",
      change: routes => {
        changeRuntimeRoute(routes, `${navigationId}:overview`, {
          navigation: { Icon: HomeOutlinedIcon, labelKey: "navigation.home", to: "/elsewhere" },
        });
      },
    },
    {
      label: "missing implementation",
      change: routes => {
        changeRuntimeRoute(routes, `${navigationId}:details`, { Component: undefined });
      },
    },
    {
      label: "unknown default child",
      change: routes => {
        changeRuntimeRoute(routes, navigationId, { defaultChildId: `${navigationId}:absent` });
      },
    },
    {
      label: "invalid direct-child default",
      change: routes => {
        changeRuntimeRoute(routes, navigationId, { defaultChildId: `${navigationId}:records` });
      },
    },
    {
      label: "parent cycle",
      change: routes => {
        changeRuntimeRoute(routes, `${navigationId}:workspace`, { parentId: `${navigationId}:records` });
      },
    },
  ];
  it.each(invalidCases)("rejects invalid factory output: $label", ({ change }) => {
    const module: NavigationModule = {
      createRoutes: mount => {
        const routes = navigationModule.createRoutes(mount);
        change(routes);
        return routes;
      },
    };
    expect(() => createGeneratedExampleRoutes({}, { [navigationFile]: module })).toThrow();
  });

  it.each([null, [], {}])("rejects non-registry factory output: %j", output => {
    const module = { createRoutes: () => output } as unknown as NavigationModule;
    expect(() => createGeneratedExampleRoutes({}, { [navigationFile]: module })).toThrow(/Invalid/);
  });
});
