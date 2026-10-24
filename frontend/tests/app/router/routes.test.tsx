import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { patternCategoryDefinitions } from "@/app/router/patternCategories";
import { createAppRouteObjects } from "@/app/router/routeHierarchy";
import { LegacyDevelopmentGuideRedirect } from "@/app/router/components/LegacyDevelopmentGuideRedirect";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import {
  appArchitectureNavigationGroups,
  appBottomNavigationItems,
  appExampleNavigationGroups,
  appNavigationItems,
  appRouteRegistry,
  appRouteHierarchyMetadata,
  architectureRelatedPatternLinks,
  routeDestination,
  routeIsEnabled,
} from "@/app/router/routeRegistry";
import { architectureArticleIds } from "@/features/development-guide/architecture";
import { createAppRoutes } from "@/app/router/routes";
import { AppAuthGate } from "@/app/auth/components/AppAuthGate";
import { RouteScrollContentReady } from "@/app/router/components/RouteScrollRestoration";
import type { AppRouteDefinition, AppRouteObject } from "@/app/router/types/AppRoute";

function authenticatedRoutes(): AppRouteObject[] {
  const root = createAppRoutes()[0];
  const authGate = root.children?.find(route => route.Component === AppAuthGate);
  const contentReady = authGate?.children?.find(route => route.Component === RouteScrollContentReady);
  const shell = contentReady?.children?.find(route => route.element !== undefined);

  if (!shell?.children) throw new Error("Expected authenticated shell routes");
  const flattened: AppRouteObject[] = [];
  function collect(route: AppRouteObject, prefix = "") {
    const path = route.path ? [prefix, route.path].filter(Boolean).join("/") : undefined;
    flattened.push({ ...route, ...(path ? { path } : {}) });
    route.children?.forEach(child => collect(child, path ?? prefix));
  }
  shell.children.forEach(route => collect(route));
  return flattened;
}

function translate(key: string): string {
  return key;
}

describe("application routes", () => {
  it("signals route content readiness at public and authenticated boundaries", () => {
    const root = createAppRoutes()[0];
    const publicBoundary = root.children?.find(route => route.Component === RouteScrollContentReady);
    const authGate = root.children?.find(route => route.Component === AppAuthGate);
    const authenticatedBoundary = authGate?.children?.find(route => route.Component === RouteScrollContentReady);

    expect(publicBoundary?.children).not.toHaveLength(0);
    expect(authenticatedBoundary?.children?.[0]?.element).toBeDefined();
  });

  it("omits retired starter destinations", () => {
    expect(appRouteRegistry).not.toHaveProperty("reports");
    expect(appRouteRegistry).not.toHaveProperty("customers");
    expect(appRouteRegistry).not.toHaveProperty("calendar");
    expect(appRouteRegistry).not.toHaveProperty("sample");
    expect(appRouteRegistry).not.toHaveProperty("sampleNested");
    expect(appRouteRegistry).not.toHaveProperty("project");
    expect(appRouteRegistry).not.toHaveProperty("projects");
    expect(appRouteRegistry).not.toHaveProperty("documents");
    expect(appRouteRegistry).toHaveProperty("contacts");
  });

  it("keeps primary navigation focused on the starter application", () => {
    expect(appNavigationItems.map(({ labelKey }) => labelKey)).toEqual(["navigation.home"]);
  });

  it("derives mobile shortcuts from route metadata and excludes the guide in production", () => {
    expect(appBottomNavigationItems.map(item => [item.labelKey, item.to])).toEqual([
      ["navigation.home", "/"],
      ["navigation.settings", "/settings/appearance"],
      ...(import.meta.env.DEV
        ? [["navigation.contactsDashboard", "/dev-guide/frontend/example-pages/contacts-dashboard"]]
        : []),
    ]);
    if (import.meta.env.DEV) {
      expect(appBottomNavigationItems[2]?.activePath).toBe("/dev-guide/frontend/example-pages/contacts-dashboard");
      expect(appBottomNavigationItems[2]?.Icon).toBe(ContactsOutlinedIcon);
    }
  });

  it("keeps Home titles and includes the dashboard in its Example pages breadcrumbs", () => {
    const home = authenticatedRoutes().find(route => route.index);
    const guideHome = authenticatedRoutes().find(
      route => route.path === "dev-guide/frontend/example-pages/contacts-dashboard",
    );
    expect(
      home?.handle?.resolveBreadcrumbs(
        {
          app: translate as unknown as TFunction<"translation">,
          developmentGuide: translate as unknown as TFunction<"development-guide">,
        },
        {},
      ),
    ).toEqual([{ label: "navigation.home" }]);
    if (import.meta.env.DEV) {
      expect(
        guideHome?.handle?.resolveBreadcrumbs(
          {
            app: translate as unknown as TFunction<"translation">,
            developmentGuide: translate as unknown as TFunction<"development-guide">,
          },
          {},
        ),
      ).toEqual([
        { label: "navigation.developmentGuide", to: "/dev-guide" },
        { label: "navigation.frontend", to: "/dev-guide/frontend" },
        { label: "navigation.examplePages", to: "/dev-guide/frontend/example-pages" },
        { label: "navigation.contactsDashboard" },
      ]);
      expect(
        guideHome?.handle?.resolveTitle(
          {
            app: translate as unknown as TFunction<"translation">,
            developmentGuide: translate as unknown as TFunction<"development-guide">,
          },
          {},
        ),
      ).toBe("navigation.contactsDashboard");
    }
  });

  it("routes Settings through its Appearance, Navigation, and Accessibility sections", () => {
    const settings = authenticatedRoutes().find(route => route.path === "settings");
    const appearance = authenticatedRoutes().find(route => route.path === "settings/appearance");
    const navigation = authenticatedRoutes().find(route => route.path === "settings/navigation");
    const accessibility = authenticatedRoutes().find(route => route.path === "settings/accessibility");

    expect(appRouteRegistry.settings.defaultChildId).toBe("settingsAppearance");
    expect(appRouteRegistry.settingsAppearance.parentId).toBe("settings");
    expect(appRouteRegistry.settingsNavigation.parentId).toBe("settings");
    expect(appRouteRegistry.settingsAccessibility.parentId).toBe("settings");
    expect(settings?.children?.some(child => child.index && child.element)).toBe(true);
    expect(appRouteRegistry.settings.navigation).toMatchObject({
      activePath: "/settings/*",
      to: "/settings/appearance",
    });
    expect(appBottomNavigationItems.find(item => item.labelKey === "navigation.settings")).toMatchObject({
      activePath: "/settings/*",
      to: "/settings/appearance",
    });
    expect(appearance?.handle?.mobileSurface).toBe("flush");
    expect(navigation?.handle?.mobileSurface).toBe("flush");
    expect(accessibility?.handle?.mobileSurface).toBe("flush");
    expect(
      accessibility?.handle?.resolveTitle(
        {
          app: translate as unknown as TFunction<"translation">,
          developmentGuide: translate as unknown as TFunction<"development-guide">,
        },
        {},
      ),
    ).toBe("settings.accessibility");
  });

  it("lets Contacts inherit the guide width while retaining its workspace policy", () => {
    const contacts = authenticatedRoutes().find(
      route => route.path === "dev-guide/frontend/example-pages/contacts-crud",
    );

    expect(appRouteRegistry.contacts).not.toHaveProperty("contentMaxWidth");
    expect(appRouteRegistry.developmentGuide.contentMaxWidth).toBe("xl");
    expect(appRouteRegistry.contacts.contentOverflow).toBe("hidden");
    expect(appRouteRegistry.contacts.mobileSurface).toBe("flush");
    expect(contacts?.handle?.contentMaxWidth).toBeUndefined();
    expect(
      contacts?.handle?.resolveBreadcrumbs(
        {
          app: translate as unknown as TFunction<"translation">,
          developmentGuide: translate as unknown as TFunction<"development-guide">,
        },
        {},
      ),
    ).toEqual([
      { label: "navigation.developmentGuide", to: "/dev-guide" },
      { label: "navigation.frontend", to: "/dev-guide/frontend" },
      { label: "navigation.examplePages", to: "/dev-guide/frontend/example-pages" },
      { label: "navigation.contactsCrud" },
    ]);
    expect(contacts?.handle?.contentOverflow).toBe("hidden");
    expect(contacts?.handle?.mobileSurface).toBe("flush");
  });

  it("registers development-only route trees only during development", () => {
    const developmentGuideNavigation = appNavigationItems.filter(
      ({ labelKey }) => labelKey === "navigation.developmentGuide",
    );
    const examplesRoute = authenticatedRoutes().find(route => route.path === "dev-guide/frontend/patterns");

    expect(appRouteRegistry.examples.developmentOnly).toBe(true);
    expect(routeIsEnabled(appRouteRegistry.examples, false)).toBe(false);
    expect(developmentGuideNavigation).toHaveLength(0);
    if (import.meta.env.DEV) {
      expect(appRouteRegistry.developmentGuide.navigation?.activePath).toBe("/dev-guide/*");
    }
    expect(examplesRoute !== undefined).toBe(import.meta.env.DEV);
  });

  it("registers one guide parent without the old root paths", () => {
    const paths = authenticatedRoutes().flatMap(route => (route.path ? [route.path] : []));

    expect(paths).not.toContain("contacts");
    expect(paths).not.toContain("examples");
    expect(paths).not.toContain("architecture");
    expect(paths).toContain("dev-guide");
  });

  describe.runIf(import.meta.env.DEV)("development guide categories", () => {
    it("renders the category index at the guide root and redirects only the Frontend index", () => {
      const guide = authenticatedRoutes().find(route => route.path === "dev-guide");
      const frontend = authenticatedRoutes().find(route => route.path === "dev-guide/frontend");
      const index = guide?.children?.find(route => route.index);
      expect(index?.Component).toBe(appRouteRegistry.developmentGuideIndex.Component);
      expect(index?.element).toBeUndefined();
      expect(routeDestination(appRouteRegistry.developmentGuideIndex)).toBe("/dev-guide");
      expect(frontend?.children?.find(route => route.index)?.element).toMatchObject({
        props: { replace: true, to: "/dev-guide/frontend/example-pages" },
      });
    });

    it("excludes both categories and compatibility redirects from the production route tree", () => {
      const production = createAppRouteObjects(appRouteRegistry, "authenticated", {
        isDevelopment: false,
        metadata: appRouteHierarchyMetadata,
      });
      const paths = production.flatMap(route => (route.path ? [route.path] : []));
      expect(paths.some(path => path.startsWith("dev-guide"))).toBe(false);
      for (const definition of [
        appRouteRegistry.developmentGuideFrontend,
        appRouteRegistry.developmentGuideBackend,
        appRouteRegistry.legacyDevelopmentGuideHome,
        appRouteRegistry.legacyDevelopmentGuideContacts,
        appRouteRegistry.legacyDevelopmentGuidePatterns,
        appRouteRegistry.legacyDevelopmentGuideArchitecture,
        appRouteRegistry.legacyFrontendHome,
        appRouteRegistry.legacyFrontendContacts,
        ...patternCategoryDefinitions.map(category => appRouteRegistry[category.routeId]),
      ])
        expect(routeIsEnabled(definition, false)).toBe(false);
    });

    it.each([
      ["/dev-guide/home", "/dev-guide/frontend/example-pages/contacts-dashboard"],
      ["/dev-guide/contacts", "/dev-guide/frontend/example-pages/contacts-crud"],
      ["/DEV-GUIDE/contacts", "/dev-guide/frontend/example-pages/contacts-crud"],
      ["/dev-guide/frontend/home", "/dev-guide/frontend/example-pages/contacts-dashboard"],
      ["/dev-guide/frontend/contacts", "/dev-guide/frontend/example-pages/contacts-crud"],
      [
        "/dev-guide/patterns/routing-and-url-state/nested-routes/details",
        "/dev-guide/frontend/patterns/routing-and-url-state/nested-routes/details",
      ],
      ["/dev-guide/architecture/source-map-and-ownership", "/dev-guide/frontend/architecture/source-map-and-ownership"],
    ])("redirects the compatible URL %s while preserving search, hash and state", async (pathname, target) => {
      const compatibility = Object.values(appRouteRegistry).filter(
        definition => definition.Component === LegacyDevelopmentGuideRedirect,
      ) as AppRouteDefinition[];
      expect(compatibility.map(definition => definition.path)).toEqual([
        "dev-guide/home",
        "dev-guide/contacts",
        "dev-guide/patterns/*",
        "dev-guide/architecture/*",
        "dev-guide/frontend/home",
        "dev-guide/frontend/contacts",
      ]);
      const router = createMemoryRouter(
        [
          ...compatibility.map(definition => ({ Component: LegacyDevelopmentGuideRedirect, path: definition.path })),
          { element: <p>Canonical destination</p>, path: "/dev-guide/frontend/*" },
        ],
        { initialEntries: [{ pathname, search: "?filter=recent", hash: "#details", state: { from: "bookmark" } }] },
      );
      render(<RouterProvider router={router} />);
      expect(await screen.findByText("Canonical destination")).toBeVisible();
      await waitFor(() =>
        expect(router.state.location).toMatchObject({
          pathname: target,
          search: "?filter=recent",
          hash: "#details",
          state: { from: "bookmark" },
        }),
      );
      expect(router.state.historyAction).toBe("REPLACE");
    });
  });

  describe.runIf(import.meta.env.DEV)("development Patterns routes", () => {
    it("derives ordered section tabs only from the Frontend category", () => {
      expect(appRouteRegistry.developmentGuide.navigation).toMatchObject({
        activePath: "/dev-guide/*",
        labelKey: "navigation.developmentGuide",
      });
      const guideRoute = authenticatedRoutes().find(route => route.path === "dev-guide");
      const frontendRoute = authenticatedRoutes().find(route => route.path === "dev-guide/frontend");
      const backendRoute = authenticatedRoutes().find(route => route.path === "dev-guide/backend");
      expect(guideRoute?.handle?.sectionNavigation).toBeUndefined();
      expect(backendRoute?.handle?.sectionNavigation).toBeUndefined();
      expect(frontendRoute?.handle?.headerBreadcrumb).toBe(true);
      expect(backendRoute?.handle?.headerBreadcrumb).toBe(true);
      expect(frontendRoute?.handle?.sectionNavigation).toMatchObject([
        { labelKey: "navigation.examplePages", to: "/dev-guide/frontend/example-pages" },
        { labelKey: "navigation.examples", to: "/dev-guide/frontend/patterns" },
        {
          labelKey: "handbook.categories.frontend-workflows.title",
          to: "/dev-guide/frontend/workflow-patterns",
        },
        { labelKey: "navigation.architecture", to: "/dev-guide/frontend/architecture" },
      ]);
    });

    it("orders retained categories from the independent catalog", () => {
      expect(appExampleNavigationGroups.map(({ id }) => id)).toEqual([
        "localization",
        "applicationState",
        "serverData",
        "routingAndUrlState",
        "overlays",
        "tablesAndCollections",
        "forms",
        "feedback",
      ]);
      expect(appExampleNavigationGroups.map(({ id, labelKey }) => ({ id, labelKey }))).toEqual(
        patternCategoryDefinitions.map(({ id, labelKey }) => ({ id, labelKey })),
      );
      expect(appExampleNavigationGroups.every(group => group.section === undefined)).toBe(true);
    });

    it("groups every category's article children while preserving their direct URLs", () => {
      const categoryRouteIds = new Set<string>(patternCategoryDefinitions.map(category => category.routeId));
      const routeDefinitions = Object.values(appRouteRegistry) as readonly AppRouteDefinition[];
      const exampleRoutes = routeDefinitions.filter(
        definition => definition.groupId !== undefined && categoryRouteIds.has(definition.parentId),
      );
      const groupedItems = appExampleNavigationGroups.flatMap(group => group.items);
      expect(appExampleNavigationGroups.every(({ items }) => items.length > 0)).toBe(true);
      expect(new Set(groupedItems.map(({ to }) => to))).toEqual(new Set(exampleRoutes.map(routeDestination)));
      expect(appExampleNavigationGroups.every(({ defaultExpanded }) => defaultExpanded)).toBe(true);
    });

    it("renders the Patterns index and scopes each category's default article and breadcrumbs", () => {
      const examples = authenticatedRoutes().find(route => route.path === "dev-guide/frontend/patterns");
      const index = examples?.children?.find(route => route.index);
      expect(index?.Component).toBe(appRouteRegistry.examplesIndex.Component);
      expect(index?.element).toBeUndefined();
      expect(examples?.handle?.documentationGroups).toBeUndefined();
      const translations = {
        app: translate as unknown as TFunction<"translation">,
        developmentGuide: translate as unknown as TFunction<"development-guide">,
      };
      expect(index?.handle?.resolveBreadcrumbs(translations, {})).toEqual([
        { label: "navigation.developmentGuide", to: "/dev-guide" },
        { label: "navigation.frontend", to: "/dev-guide/frontend" },
        { label: "navigation.examples" },
      ]);
      const examplePages = authenticatedRoutes().find(route => route.path === "dev-guide/frontend/example-pages");
      expect(examplePages?.children?.find(route => route.index)?.handle?.resolveBreadcrumbs(translations, {})).toEqual([
        { label: "navigation.developmentGuide", to: "/dev-guide" },
        { label: "navigation.frontend", to: "/dev-guide/frontend" },
        { label: "navigation.examplePages" },
      ]);
      for (const category of patternCategoryDefinitions) {
        const categoryRoute = authenticatedRoutes().find(route => route.path === category.path);
        const group = appExampleNavigationGroups.find(candidate => candidate.id === category.id);
        const firstExample = group?.items[0];
        if (!firstExample) throw new Error("Expected a category article");
        expect(categoryRoute?.handle?.documentationGroups).toEqual([group]);
        expect(categoryRoute?.children?.[0]?.element).toMatchObject({
          props: { replace: true, to: firstExample.to },
        });
        const firstChild = categoryRoute?.children?.find(
          route => route.path === firstExample.to.slice(category.path.length + 2),
        );
        expect(firstChild?.handle?.scrollToTop).toBe(true);
        expect(firstChild?.handle?.resolveBreadcrumbs(translations, {})).toEqual([
          { label: "navigation.developmentGuide", to: "/dev-guide" },
          { label: "navigation.frontend", to: "/dev-guide/frontend" },
          { label: "navigation.examples", to: "/dev-guide/frontend/patterns" },
          { label: category.labelKey, to: "/" + category.path },
          { label: firstExample.labelKey },
        ]);
      }
    });

    it("keeps a concrete destination and parameter-derived breadcrumbs for a dynamic route", () => {
      const definition = appRouteRegistry.routingRouteParametersAndBreadcrumbs;
      const route = authenticatedRoutes().find(
        candidate =>
          candidate.path ===
          "dev-guide/frontend/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/:projectId",
      );
      if (!route?.handle) throw new Error("Expected the dynamic routing example");

      expect(routeDestination(definition)).toBe(
        "/dev-guide/frontend/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/atlas",
      );
      expect(definition.navigation.activePath).toBe(
        "/dev-guide/frontend/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/:projectId",
      );
      expect(
        route.handle.resolveBreadcrumbs(
          {
            app: translate as unknown as TFunction<"translation">,
            developmentGuide: translate as unknown as TFunction<"development-guide">,
          },
          { projectId: "harbor" },
        ),
      ).toEqual([
        { label: "navigation.developmentGuide", to: "/dev-guide" },
        { label: "navigation.frontend", to: "/dev-guide/frontend" },
        { label: "navigation.examples", to: "/dev-guide/frontend/patterns" },
        { label: "navigation.routingAndUrlState", to: "/dev-guide/frontend/patterns/routing-and-url-state" },
        {
          label: "navigation.routingRouteParametersAndBreadcrumbs",
          to: "/dev-guide/frontend/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/atlas",
        },
        { label: "navigation.routingProject" },
      ]);
    });
  });

  describe.runIf(import.meta.env.DEV)("development Architecture routes", () => {
    it("derives optional Pattern links from retained route metadata", () => {
      expect(architectureRelatedPatternLinks(["examples", "removedPatternRoute"])).toEqual([
        {
          labelKey: "navigation.examples",
          to: "/dev-guide/frontend/patterns",
        },
      ]);
    });

    it("keeps development-only guide routes outside the main drawer", () => {
      expect(appRouteRegistry.architecture.developmentOnly).toBe(true);
      expect(routeIsEnabled(appRouteRegistry.architecture, false)).toBe(false);
      expect(routeDestination(appRouteRegistry.developmentGuideHome)).toBe(
        "/dev-guide/frontend/example-pages/contacts-dashboard",
      );
      expect(appNavigationItems.some(({ labelKey }) => labelKey === "navigation.developmentGuide")).toBe(false);
    });

    it("derives the 15 direct routes and grouped order from the catalog", () => {
      const items = appArchitectureNavigationGroups.flatMap(group => group.items);
      expect(items.map(({ to }) => to.replace("/dev-guide/frontend/architecture/", ""))).toEqual(
        architectureArticleIds,
      );
      expect(new Set(items.map(({ to }) => to)).size).toBe(items.length);
      expect(appArchitectureNavigationGroups.map(({ id }) => id)).toEqual([
        "startHere",
        "startup",
        "application",
        "features",
        "pages",
        "contributing",
      ]);
    });

    it("owns an independent index redirect and child breadcrumbs", () => {
      const architecture = authenticatedRoutes().find(route => route.path === "dev-guide/frontend/architecture");
      if (!architecture?.children || !architecture.handle) {
        throw new Error("Expected the Architecture parent route");
      }

      expect(architecture.handle.documentationGroups).toBe(appArchitectureNavigationGroups);
      expect(architecture.children[0]).toMatchObject({
        element: {
          props: {
            replace: true,
            to: "/dev-guide/frontend/architecture/source-map-and-ownership",
          },
        },
        index: true,
      });
      const firstArticle = architecture.children.find(route => route.path === "source-map-and-ownership");
      expect(
        firstArticle?.handle?.resolveBreadcrumbs(
          {
            app: translate as unknown as TFunction<"translation">,
            developmentGuide: translate as unknown as TFunction<"development-guide">,
          },
          {},
        ),
      ).toEqual([
        { label: "navigation.developmentGuide", to: "/dev-guide" },
        { label: "navigation.frontend", to: "/dev-guide/frontend" },
        { label: "navigation.architecture", to: "/dev-guide/frontend/architecture" },
        { label: "architectureGuide.articles.sourceMapAndOwnership" },
      ]);
    });
  });
});
