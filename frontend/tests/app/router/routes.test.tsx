import { matchRoutes } from "react-router";
import { describe, expect, it } from "vitest";

import { createAppI18n } from "@/app/localization/createAppI18n";
import { AppAuthGate } from "@/app/auth/components/AppAuthGate";
import { RouteScrollContentReady } from "@/app/router/components/RouteScrollRestoration";
import { createAppRouteObjects } from "@/app/router/routeHierarchy";
import {
  appBottomNavigationItems,
  appNavigationItems,
  appRouteRegistry,
  routeDestination,
  routeIsEnabled,
} from "@/app/router/routeRegistry";
import { createAppRoutes } from "@/app/router/routes";

describe("application routes", () => {
  it("signals route readiness at public and authenticated boundaries", () => {
    const root = createAppRoutes()[0];
    expect(root.children?.find(route => route.Component === RouteScrollContentReady)?.children).not.toHaveLength(0);
    const auth = root.children?.find(route => route.Component === AppAuthGate);
    expect(
      auth?.children?.find(route => route.Component === RouteScrollContentReady)?.children?.[0]?.element,
    ).toBeDefined();
  });

  it("registers only Home, authentication, Settings and recovery in either environment", () => {
    expect(Object.keys(appRouteRegistry)).toEqual([
      "home",
      "login",
      "notFound",
      "settings",
      "settingsAppearance",
      "settingsNavigation",
      "settingsAccessibility",
    ]);
    for (const isDevelopment of [true, false]) {
      expect(Object.values(appRouteRegistry).every(route => routeIsEnabled(route, isDevelopment))).toBe(true);
    }
    expect(appNavigationItems.map(item => [item.labelKey, item.kind])).toEqual([["navigation.home", "link"]]);
    expect(appBottomNavigationItems.map(item => [item.labelKey, item.to])).toEqual([
      ["navigation.home", "/"],
      ["navigation.settings", "/settings/appearance"],
    ]);
  });

  it.each([
    "/dev-guide",
    "/dev-guide/frontend",
    "/dev-guide/contacts",
    "/dev-guide/frontend/example-pages/contacts-crud",
    "/dev-guide/frontend/patterns/forms/dependent-fields",
    "/dev-guide/frontend/architecture/source-map-and-ownership",
    "/dev-guide/backend",
    "/contacts",
    "/examples",
    "/architecture",
  ])("retired URL %s resolves through Not Found", path => {
    for (const isDevelopment of [true, false]) {
      const routes = createAppRouteObjects(appRouteRegistry, "authenticated", { isDevelopment });
      expect(matchRoutes(routes, path)?.at(-1)?.route.path).toBe("*");
    }
  });

  it.each(["en", "hr"] as const)("preserves localized Settings routes and breadcrumbs in %s", locale => {
    const app = createAppI18n(locale).getFixedT(locale, "translation");
    const settings = createAppRouteObjects(appRouteRegistry, "authenticated").find(route => route.path === "settings");
    expect(settings?.children?.some(child => child.index && child.element)).toBe(true);
    expect(appRouteRegistry.settings.defaultChildId).toBe("settingsAppearance");
    expect(routeDestination(appRouteRegistry.settings)).toBe("/settings/appearance");
    const accessibility = settings?.children?.find(route => route.path === "accessibility");
    expect(accessibility?.handle?.mobileSurface).toBe("flush");
    expect(accessibility?.handle?.resolveBreadcrumbs({ app }, {})).toEqual([
      { label: app("navigation.settings"), to: "/settings/appearance" },
      { label: app("settings.accessibility") },
    ]);
  });
});
