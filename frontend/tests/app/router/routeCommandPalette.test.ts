import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { describe, expect, it, vi } from "vitest";

import { createAppI18n } from "@/app/localization/createAppI18n";
import { createAppCommandPaletteEntries } from "@/app/router/routeCommandPalette";
import type { AppRouteRegistry } from "@/app/router/routeHierarchy";
import { appRouteRegistry } from "@/app/router/routeRegistry";
import type { AppRouteDefinition } from "@/app/router/types/AppRoute";

function EmptyPage() {
  return null;
}

function page(overrides: Partial<AppRouteDefinition> = {}): AppRouteDefinition {
  return {
    Component: EmptyPage,
    access: "authenticated",
    commandPalette: true,
    path: "/page",
    title: () => "Page",
    ...overrides,
  } as AppRouteDefinition;
}

function translations(locale: "en" | "hr" = "en") {
  const i18n = createAppI18n(locale);
  return { app: i18n.getFixedT(locale, "translation"), developmentGuide: i18n.getFixedT(locale, "development-guide") };
}

describe("command palette route entries", () => {
  it("ships only Home and the three Settings content pages in production, with translated parent context", () => {
    expect(createAppCommandPaletteEntries(appRouteRegistry, translations(), false)).toEqual([
      { context: "", id: "home", label: "Home", to: "/" },
      { context: "Settings", id: "settingsAppearance", label: "Appearance", to: "/settings/appearance" },
      { context: "Settings", id: "settingsNavigation", label: "Navigation", to: "/settings/navigation" },
      { context: "Settings", id: "settingsAccessibility", label: "Accessibility", to: "/settings/accessibility" },
    ]);
    const croatian = createAppCommandPaletteEntries(appRouteRegistry, translations("hr"), false);
    expect(croatian[3]).toMatchObject({ context: "Postavke", label: "Pristupačnost" });
    expect(
      createAppCommandPaletteEntries(appRouteRegistry, translations(), true).some(entry => entry.id === "contacts"),
    ).toBe(true);
  });

  it("includes the category landing and Backend content with Frontend context for existing pages", () => {
    const entries = createAppCommandPaletteEntries(appRouteRegistry, translations(), true);
    expect(entries).toContainEqual({
      id: "developmentGuideIndex",
      label: "Development guide",
      context: "Development guide",
      to: "/dev-guide",
    });
    expect(entries).toContainEqual({
      id: "developmentGuideBackend",
      label: "Backend",
      context: "Development guide",
      to: "/dev-guide/backend",
    });
    expect(entries.find(entry => entry.id === "contacts")).toMatchObject({
      context: "Development guide / Frontend / Example pages",
      label: "Contacts CRUD",
      to: "/dev-guide/frontend/example-pages/contacts-crud",
    });
    expect(entries.some(entry => entry.id.startsWith("legacy"))).toBe(false);
  });

  it("requires explicit membership, excludes public pages, and inherits development availability", () => {
    const registry: AppRouteRegistry = {
      parent: page({ developmentOnly: true, path: "/dev" }),
      child: page({ parentId: "parent", path: "/dev/child" }),
      unselected: page({ commandPalette: undefined, path: "/hidden" }),
      public: page({ access: "public", path: "/login" }),
      ordinary: page({ path: "/ordinary" }),
    };
    expect(createAppCommandPaletteEntries(registry, translations(), false).map(entry => entry.id)).toEqual([
      "ordinary",
    ]);
    expect(createAppCommandPaletteEntries(registry, translations(), true).map(entry => entry.id)).toEqual([
      "parent",
      "child",
      "ordinary",
    ]);
    expect(
      createAppCommandPaletteEntries(
        {
          parent: page({ path: "/parent" }),
          child: page({ commandPalette: undefined, parentId: "parent", path: "/parent/child" }),
        },
        translations(),
      ).map(entry => entry.id),
    ).toEqual(["parent"]);
  });

  it("resolves root and nested indexes, honors concrete dynamic links, and deduplicates in registry order", () => {
    const dynamicTitle = vi.fn(() => {
      throw new Error("requires route parameters");
    });
    const registry: AppRouteRegistry = {
      root: { Component: EmptyPage, access: "authenticated", commandPalette: true, index: true, title: () => "Root" },
      wrapper: page({ commandPalette: undefined, path: "/workspace", title: () => "Workspace" }),
      nestedIndex: {
        Component: EmptyPage,
        access: "authenticated",
        commandPalette: true,
        index: true,
        parentId: "wrapper",
        title: () => "Overview",
      },
      duplicate: page({ path: "/workspace", title: () => "Duplicate" }),
      dynamic: page({
        path: "/projects/:projectId",
        navigation: { Icon: HomeOutlinedIcon, labelKey: "navigation.home", to: "/projects/atlas" },
        title: dynamicTitle,
      }),
      wildcardRoot: page({
        path: "/examples/*",
        navigation: { Icon: HomeOutlinedIcon, labelKey: "navigation.home" },
      }),
    };
    expect(createAppCommandPaletteEntries(registry, translations()).map(({ id, to }) => ({ id, to }))).toEqual([
      { id: "root", to: "/" },
      { id: "nestedIndex", to: "/workspace" },
      { id: "dynamic", to: "/projects/atlas" },
      { id: "wildcardRoot", to: "/examples" },
    ]);
    expect(dynamicTitle).not.toHaveBeenCalled();
  });

  it("rejects external, malformed, unresolved and catch-all destinations without evaluating dynamic titles", () => {
    const dynamicTitle = vi.fn(() => {
      throw new Error("requires parameters");
    });
    const destinations = [
      "https://example.org",
      "//example.org/page",
      "/\\example.org/page",
      "/projects/:id",
      "/projects/*",
      "/page\n",
    ];
    const registry: AppRouteRegistry = Object.fromEntries(
      destinations.map((to, index) => [
        `invalid${index}`,
        page({ navigation: { Icon: HomeOutlinedIcon, labelKey: "navigation.home", to } }),
      ]),
    );
    expect(
      createAppCommandPaletteEntries(
        {
          ...registry,
          dynamic: page({ path: "/projects/:id", title: dynamicTitle }),
          catchAll: page({ path: "*" }),
          wildcardWithoutStaticLabel: page({ path: "/dynamic-splat/*", title: dynamicTitle }),
          concreteDynamicWithoutLabel: page({ path: "/projects/:id", title: dynamicTitle }),
        },
        translations(),
      ),
    ).toEqual([]);
    expect(dynamicTitle).not.toHaveBeenCalled();
  });

  it("omits parameter-dependent ancestor titles while retaining static localized ancestor labels", () => {
    const dynamicTitle = vi.fn(() => {
      throw new Error("missing project id");
    });
    const registry: AppRouteRegistry = {
      projects: page({ commandPalette: undefined, path: "/projects", title: () => "Projects" }),
      project: page({ commandPalette: undefined, parentId: "projects", path: "/projects/:id", title: dynamicTitle }),
      details: page({
        parentId: "project",
        path: "/projects/:id/details",
        navigation: { Icon: HomeOutlinedIcon, labelKey: "navigation.home", to: "/projects/atlas/details" },
      }),
    };
    expect(createAppCommandPaletteEntries(registry, translations())[0]).toMatchObject({
      context: "Projects",
      label: "Home",
    });
    expect(dynamicTitle).not.toHaveBeenCalled();
  });
});
