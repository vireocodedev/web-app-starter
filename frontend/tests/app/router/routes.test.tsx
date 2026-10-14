import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import {
  appArchitectureNavigationGroups,
  appBottomNavigationItems,
  appExampleNavigationGroups,
  appNavigationItems,
  appRouteRegistry,
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
      ...(import.meta.env.DEV ? [["navigation.contactsDashboard", "/dev-guide/home"]] : []),
    ]);
    if (import.meta.env.DEV) {
      expect(appBottomNavigationItems[2]?.activePath).toBe("/dev-guide/home");
      expect(appBottomNavigationItems[2]?.Icon).toBe(ContactsOutlinedIcon);
    }
  });

  it("shows route titles in Home and Development Guide Home breadcrumbs", () => {
    const home = authenticatedRoutes().find(route => route.index);
    const guideHome = authenticatedRoutes().find(route => route.path === "dev-guide/home");
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

  it("lets the Contacts feature use the full routed content width", () => {
    const contacts = authenticatedRoutes().find(route => route.path === "dev-guide/contacts");

    expect(appRouteRegistry.contacts.contentMaxWidth).toBe(false);
    expect(appRouteRegistry.contacts.contentOverflow).toBe("hidden");
    expect(appRouteRegistry.contacts.mobileSurface).toBe("flush");
    expect(contacts?.handle?.contentMaxWidth).toBe(false);
    expect(contacts?.handle?.contentOverflow).toBe("hidden");
    expect(contacts?.handle?.mobileSurface).toBe("flush");
  });

  it("registers development-only route trees only during development", () => {
    const developmentGuideNavigation = appNavigationItems.filter(
      ({ labelKey }) => labelKey === "navigation.developmentGuide",
    );
    const examplesRoute = authenticatedRoutes().find(route => route.path === "dev-guide/patterns");

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

  describe.runIf(import.meta.env.DEV)("development Patterns routes", () => {
    it("derives ordered section tabs from the opted-in guide parent", () => {
      expect(appRouteRegistry.developmentGuide.navigation).toMatchObject({
        activePath: "/dev-guide/*",
        labelKey: "navigation.developmentGuide",
      });
      const guideRoute = authenticatedRoutes().find(route => route.path === "dev-guide");
      expect(guideRoute?.handle?.sectionNavigation).toMatchObject([
        { labelKey: "navigation.home", to: "/dev-guide/home" },
        { labelKey: "navigation.contacts", to: "/dev-guide/contacts" },
        { labelKey: "navigation.examples", to: "/dev-guide/patterns" },
        { labelKey: "navigation.architecture", to: "/dev-guide/architecture" },
      ]);
    });

    it("orders retained categories and marks only the application-state section", () => {
      const order = [
        "localization",
        "applicationState",
        "serverData",
        "routingAndUrlState",
        "overlays",
        "tablesAndCollections",
        "forms",
        "feedback",
      ];
      const retained = appExampleNavigationGroups.map(({ id }) => id);
      expect(retained).toEqual(order.filter(id => retained.some(value => value === id)));
      for (const group of appExampleNavigationGroups) {
        expect(group.section).toBe(
          ["applicationState", "serverData", "routingAndUrlState"].includes(group.id) ? "applicationState" : undefined,
        );
      }
    });

    it("groups every example child while preserving its direct URL", () => {
      const routeDefinitions = Object.values(appRouteRegistry) as readonly AppRouteDefinition[];
      const exampleRoutes = routeDefinitions.filter(definition => definition.parentId === "examples");
      const groupedItems = appExampleNavigationGroups.flatMap(group => group.items);

      expect(appExampleNavigationGroups.every(({ items }) => items.length > 0)).toBe(true);
      expect(new Set(appExampleNavigationGroups.map(({ id }) => id)).size).toBe(appExampleNavigationGroups.length);
      expect(new Set(groupedItems.map(({ to }) => to))).toEqual(new Set(exampleRoutes.map(routeDestination)));
      expect(appExampleNavigationGroups.every(({ defaultExpanded }) => defaultExpanded)).toBe(true);
    });

    it("nests examples and derives the index redirect and breadcrumbs", () => {
      const examples = authenticatedRoutes().find(route => route.path === "dev-guide/patterns");
      if (!examples?.children || !examples.handle) {
        throw new Error("Expected the Examples parent route");
      }

      expect(examples.handle.documentationGroups).toBe(appExampleNavigationGroups);
      expect(examples.children[0]).toMatchObject({ index: true });
      const firstExample = appExampleNavigationGroups[0]?.items[0];
      if (!firstExample) throw new Error("Expected at least one example route");

      expect(examples.children[0].element).toMatchObject({
        props: {
          replace: true,
          to: firstExample.to,
        },
      });

      const firstChild = examples.children.find(
        route => route.path === firstExample.to.replace(/^\/dev-guide\/patterns\//, ""),
      );
      if (!firstChild?.handle) {
        throw new Error("Expected the first example route");
      }

      expect(firstChild.handle.scrollToTop).toBe(true);
      expect(
        firstChild.handle.resolveBreadcrumbs(
          {
            app: translate as unknown as TFunction<"translation">,
            developmentGuide: translate as unknown as TFunction<"development-guide">,
          },
          {},
        ),
      ).toEqual([
        { label: "navigation.developmentGuide", to: "/dev-guide" },
        { label: "navigation.examples", to: "/dev-guide/patterns" },
        { label: firstExample.labelKey },
      ]);
    });

    it("keeps a concrete destination and parameter-derived breadcrumbs for a dynamic route", () => {
      const definition = appRouteRegistry.routingRouteParametersAndBreadcrumbs;
      const examples = authenticatedRoutes().find(route => route.path === "dev-guide/patterns");
      const route = examples?.children?.find(
        candidate => candidate.path === "routing-and-url-state/route-parameters-and-breadcrumbs/:projectId",
      );
      if (!route?.handle) throw new Error("Expected the dynamic routing example");

      expect(routeDestination(definition)).toBe(
        "/dev-guide/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/atlas",
      );
      expect(definition.navigation.activePath).toBe(
        "/dev-guide/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/:projectId",
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
        { label: "navigation.examples", to: "/dev-guide/patterns" },
        {
          label: "navigation.routingRouteParametersAndBreadcrumbs",
          to: "/dev-guide/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/atlas",
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
          to: "/dev-guide/patterns",
        },
      ]);
    });

    it("keeps development-only guide routes outside the main drawer", () => {
      expect(appRouteRegistry.architecture.developmentOnly).toBe(true);
      expect(routeIsEnabled(appRouteRegistry.architecture, false)).toBe(false);
      expect(routeDestination(appRouteRegistry.developmentGuideHome)).toBe("/dev-guide/home");
      expect(appNavigationItems.some(({ labelKey }) => labelKey === "navigation.developmentGuide")).toBe(false);
    });

    it("derives the 15 direct routes and grouped order from the catalog", () => {
      const items = appArchitectureNavigationGroups.flatMap(group => group.items);
      expect(items.map(({ to }) => to.replace("/dev-guide/architecture/", ""))).toEqual(architectureArticleIds);
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
      const architecture = authenticatedRoutes().find(route => route.path === "dev-guide/architecture");
      if (!architecture?.children || !architecture.handle) {
        throw new Error("Expected the Architecture parent route");
      }

      expect(architecture.handle.documentationGroups).toBe(appArchitectureNavigationGroups);
      expect(architecture.children[0]).toMatchObject({
        element: {
          props: {
            replace: true,
            to: "/dev-guide/architecture/source-map-and-ownership",
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
        { label: "navigation.architecture", to: "/dev-guide/architecture" },
        { label: "architectureGuide.articles.sourceMapAndOwnership" },
      ]);
    });
  });
});
