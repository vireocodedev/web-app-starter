import WidgetsOutlinedIcon from "@mui/icons-material/WidgetsOutlined";
import type { ComponentType } from "react";
import { Outlet } from "react-router";

import {
  GeneratedExamplesIndexPage,
  type GeneratedExampleEntry,
} from "@/pages/development-guide/generated/GeneratedExamplesIndexPage";

import { validateAppRouteRegistry } from "./routeHierarchy";
import type { AppRouteDefinition } from "./types/AppRoute";

type ExampleLoader = () => Promise<{ Component: ComponentType }>;
type GeneratedNavigationModule = Readonly<{
  createRoutes: (
    mount: Readonly<{
      idPrefix: string;
      path: string;
      parentId?: string;
      developmentOnly?: boolean;
    }>,
  ) => Record<string, AppRouteDefinition>;
}>;
type GeneratedExampleRouteId = "generatedExamples" | "generatedExamplesIndex" | `generated-example:${string}`;

function exampleLabel(name: string): string {
  return name
    .split("-")
    .map(word => word[0]!.toUpperCase() + word.slice(1))
    .join(" ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Reject escaped mounts before handing ordinary route relationships to the hierarchy owner. */
function validateNavigationRoutes(routes: Record<string, AppRouteDefinition>, idPrefix: string, path: string): void {
  const candidates: unknown = routes;
  if (!isRecord(candidates)) {
    throw new Error(`Invalid generated navigation routes: ${idPrefix}`);
  }
  const root = candidates[idPrefix];
  if (
    !Object.hasOwn(candidates, idPrefix) ||
    !isRecord(root) ||
    root.index ||
    root.path !== path ||
    root.parentId !== "generatedExamples" ||
    root.developmentOnly !== true
  ) {
    throw new Error(`Invalid generated navigation root: ${idPrefix}`);
  }
  function containedPath(value: string): boolean {
    const normalized = value.replace(/^\//, "");
    return (
      (normalized === path || normalized.startsWith(`${path}/`)) &&
      !/[?#\\]/.test(normalized) &&
      !normalized.split("/").some(segment => !segment || segment === "." || segment === "..")
    );
  }
  for (const [id, route] of Object.entries(candidates)) {
    if (id !== idPrefix && !id.startsWith(`${idPrefix}:`)) {
      throw new Error(`Invalid generated navigation identity: ${id}`);
    }
    if (
      !isRecord(route) ||
      route.access !== "authenticated" ||
      typeof route.title !== "function" ||
      (route.index !== undefined && typeof route.index !== "boolean") ||
      (route.developmentOnly !== undefined && route.developmentOnly !== true) ||
      Boolean(route.Component) === Boolean(route.lazy) ||
      (route.lazy !== undefined && typeof route.lazy !== "function") ||
      (route.Component !== undefined &&
        (route.Component === null || (typeof route.Component !== "function" && typeof route.Component !== "object"))) ||
      (route.index ? route.path !== undefined : typeof route.path !== "string" || !containedPath(route.path)) ||
      (id !== idPrefix && (typeof route.parentId !== "string" || !Object.hasOwn(candidates, route.parentId))) ||
      (route.navigation !== undefined &&
        (!isRecord(route.navigation) ||
          (route.navigation.to !== undefined &&
            (typeof route.navigation.to !== "string" || !containedPath(route.navigation.to))) ||
          (route.navigation.activePath !== undefined &&
            (typeof route.navigation.activePath !== "string" || !containedPath(route.navigation.activePath)))))
    ) {
      throw new Error(`Invalid generated navigation route: ${id}`);
    }
  }
  validateAppRouteRegistry(
    {
      generatedExamples: {
        Component: Outlet,
        access: "authenticated",
        developmentOnly: true,
        path: "dev-guide/frontend/generated",
        title: () => "Generated examples",
      },
      ...routes,
    },
    { isDevelopment: true },
  );
}

/** File discovery supplies data to the existing router, with no second matcher or source rewriting. */
export function createGeneratedExampleRoutes(
  loaders: Readonly<Record<string, ExampleLoader>>,
  navigationModules: Readonly<Record<string, GeneratedNavigationModule>> = {},
): Record<GeneratedExampleRouteId, AppRouteDefinition> {
  const entries: GeneratedExampleEntry[] = [];
  const routes: Record<string, AppRouteDefinition> = {};
  for (const [file, lazy] of Object.entries(loaders).sort(([a], [b]) => a.localeCompare(b, "en"))) {
    const match =
      /\/generated\/(component|form|shell|table|page|feature)\/([a-z][a-z0-9]*(?:-[a-z0-9]+)*)--([a-z][a-z0-9]*(?:-[a-z0-9]+)*)\.example\.tsx$/.exec(
        file,
      );
    if (!match) throw new Error(`Invalid generated example path: ${file}`);
    const [, kind, feature, name] = match;
    const id = `generated-example:${kind}:${feature}:${name}`;
    if (Object.hasOwn(routes, id)) throw new Error(`Duplicate generated example route: ${id}`);
    const label = exampleLabel(name!);
    const routePath = `dev-guide/frontend/generated/${kind}/${feature}--${name}`;
    entries.push({ id, kind: kind as GeneratedExampleEntry["kind"], label, to: `/${routePath}` });
    routes[id] = {
      access: "authenticated",
      commandPalette: true,
      developmentOnly: true,
      lazy,
      parentId: "generatedExamples",
      path: routePath,
      title: () => label,
    };
  }
  for (const [file, module] of Object.entries(navigationModules).sort(([a], [b]) => a.localeCompare(b, "en"))) {
    const match = /\/generated\/([a-z][a-z0-9]*(?:-[a-z0-9]+)*)--([a-z][a-z0-9]*(?:-[a-z0-9]+)*)\.routes\.tsx$/.exec(
      file,
    );
    if (!match || !module || typeof module.createRoutes !== "function") {
      throw new Error(`Invalid generated navigation module: ${file}`);
    }
    const [, feature, name] = match;
    const id = `generated-example:navigation:${feature}:${name}`;
    const routePath = `dev-guide/frontend/generated/navigation/${feature}--${name}`;
    const factoryRoutes = module.createRoutes({
      idPrefix: id,
      path: routePath,
      parentId: "generatedExamples",
      developmentOnly: true,
    });
    validateNavigationRoutes(factoryRoutes, id, routePath);
    for (const [routeId, route] of Object.entries(factoryRoutes)) {
      if (Object.hasOwn(routes, routeId)) throw new Error(`Duplicate generated example route: ${routeId}`);
      routes[routeId] = route;
    }
    entries.push({ id, kind: "navigation", label: exampleLabel(name!), to: `/${routePath}` });
  }
  return {
    generatedExamples: {
      Component: Outlet,
      access: "authenticated",
      developmentOnly: true,
      navigation: { Icon: WidgetsOutlinedIcon, labelKey: "generatedExamples.title" },
      parentId: "developmentGuideFrontend",
      path: "dev-guide/frontend/generated",
      title: t => t("generatedExamples.title"),
      translationNamespace: "development-guide",
    },
    generatedExamplesIndex: {
      Component: () => <GeneratedExamplesIndexPage entries={entries} />,
      access: "authenticated",
      commandPalette: true,
      developmentOnly: true,
      index: true,
      parentId: "generatedExamples",
      title: t => t("generatedExamples.title"),
      translationNamespace: "development-guide",
    },
    ...routes,
  };
}

// The production branch never references example modules; Vite eliminates their imports.
export const generatedExampleRouteRegistry = (
  import.meta.env.DEV
    ? createGeneratedExampleRoutes(
        import.meta.glob<{ Component: ComponentType }>("../../pages/development-guide/generated/*/*.example.tsx"),
        import.meta.glob<GeneratedNavigationModule>("./generated/*.routes.tsx", { eager: true }),
      )
    : {}
) as Record<GeneratedExampleRouteId, AppRouteDefinition>;
