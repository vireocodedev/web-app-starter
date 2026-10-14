import { Navigate, type Params } from "react-router";

import type { DocumentationNavigationGroup } from "@/app/shell/documentation/DocumentationNavigation";
import type {
  AppRouteAccess,
  AppRouteDefinition,
  AppRouteObject,
  AppRouteTranslations,
  AppNavigationLink,
} from "./types/AppRoute";

export type AppRouteRegistry = Readonly<Record<string, AppRouteDefinition>>;

export type AppRouteHierarchyMetadata = Readonly<
  Record<
    string,
    Readonly<{
      defaultChildId?: string;
      documentationGroups?: readonly DocumentationNavigationGroup[];
    }>
  >
>;

type RouteHierarchyOptions = Readonly<{
  isDevelopment?: boolean;
  metadata?: AppRouteHierarchyMetadata;
}>;

function routeError(routeId: string, message: string): Error {
  return new Error(`Route "${routeId}" ${message}`);
}

function concretePath(path: string): string {
  return path.replace(/^\//, "").replace(/\/$/, "");
}

function childPath(
  parentId: string,
  parentDefinition: AppRouteDefinition,
  childId: string,
  childDefinition: AppRouteDefinition,
): string {
  if (parentDefinition.index || !("path" in parentDefinition)) {
    throw routeError(childId, `cannot be nested below index route "${parentId}"`);
  }
  if (childDefinition.index || !("path" in childDefinition)) {
    throw routeError(childId, "must define a path or be an index route");
  }

  const parentPath = concretePath(parentDefinition.path);
  const childPathname = concretePath(childDefinition.path);
  if (!childPathname) {
    throw routeError(childId, "must define a non-empty path below its parent");
  }
  if (!parentPath) return childPathname;

  const prefix = `${parentPath}/`;

  if (!childPathname.startsWith(prefix)) {
    throw routeError(
      childId,
      `path "${childDefinition.path}" must be below parent "${parentId}" path "${parentDefinition.path}"`,
    );
  }

  return childPathname.slice(prefix.length);
}

export function routeDestinationFromRegistry(registry: AppRouteRegistry, routeId: string): string {
  function resolve(currentRouteId: string, ancestry: readonly string[]): string {
    const cycleStart = ancestry.indexOf(currentRouteId);
    if (cycleStart >= 0) {
      const cycle = [...ancestry.slice(cycleStart), currentRouteId];
      throw routeError(currentRouteId, `forms a destination parent cycle: ${cycle.join(" -> ")}`);
    }

    const definition = registry[currentRouteId];
    if (!definition) throw routeError(currentRouteId, "is not registered");
    if (definition.navigation?.to) return definition.navigation.to;
    if (definition.index) {
      return definition.parentId ? resolve(definition.parentId, [...ancestry, currentRouteId]) : "/";
    }
    return `/${concretePath(definition.path).replace(/\/\*$/, "")}`;
  }

  return resolve(routeId, []);
}

function routeDestinationWithParams(
  registry: AppRouteRegistry,
  routeId: string,
  params: Readonly<Params<string>>,
): string | undefined {
  const definition = registry[routeId];
  if (!definition) throw routeError(routeId, "is not registered");
  if (definition.navigation?.to) return definition.navigation.to;
  if (definition.index) {
    return definition.parentId ? routeDestinationWithParams(registry, definition.parentId, params) : "/";
  }

  const segments: string[] = [];
  for (const segment of concretePath(definition.path).split("/")) {
    if (!segment) continue;
    if (segment === "*") {
      const splat = params["*"];
      if (splat !== undefined) {
        segments.push(...splat.split("/").map(part => encodeURIComponent(part)));
      }
      continue;
    }

    const parameter = /^:([^?]+)(\?)?$/.exec(segment);
    if (!parameter) {
      segments.push(segment);
      continue;
    }

    const value = params[parameter[1]!];
    if (value === undefined) {
      if (parameter[2]) continue;
      return undefined;
    }
    segments.push(encodeURIComponent(value));
  }

  return `/${segments.join("/")}`;
}

/** Resolves an ordered navigation destination without traversing ancestry. */
export function directChildRouteIdForDestination(
  registry: AppRouteRegistry,
  parentId: string,
  destination: string,
): string | undefined {
  return Object.entries(registry).find(([, definition]) => {
    if (definition.parentId !== parentId || definition.index) return false;
    const childDestination = definition.navigation?.to ?? `/${concretePath(definition.path).replace(/\/\*$/, "")}`;
    return childDestination === destination;
  })?.[0];
}

export function routeIsEnabledInRegistry(registry: AppRouteRegistry, routeId: string, isDevelopment: boolean): boolean {
  const definition = registry[routeId];
  if (!definition) throw routeError(routeId, "is not registered");
  if (definition.developmentOnly && !isDevelopment) return false;
  return definition.parentId ? routeIsEnabledInRegistry(registry, definition.parentId, isDevelopment) : true;
}

function effectiveDefaultChildId(
  definition: AppRouteDefinition,
  routeId: string,
  metadata: AppRouteHierarchyMetadata,
): string | undefined {
  return definition.defaultChildId ?? metadata[routeId]?.defaultChildId;
}

/** Validates the complete declared registry before environment or access filtering. */
export function validateAppRouteRegistry(registry: AppRouteRegistry, options: RouteHierarchyOptions = {}): void {
  const isDevelopment = options.isDevelopment ?? import.meta.env.DEV;
  const metadata = options.metadata ?? {};
  const entries = Object.entries(registry);
  const childrenByParent = new Map<string, string[]>();

  for (const [routeId, definition] of entries) {
    if (!definition.parentId) continue;
    const parent = registry[definition.parentId];
    if (!parent) {
      throw routeError(routeId, `references unknown parent "${definition.parentId}"`);
    }
    if (definition.access !== parent.access) {
      throw routeError(
        routeId,
        `uses access "${definition.access}" but parent "${definition.parentId}" uses "${parent.access}"`,
      );
    }
    if (!definition.index) {
      childPath(definition.parentId, parent, routeId, definition);
    }
    const siblings = childrenByParent.get(definition.parentId) ?? [];
    siblings.push(routeId);
    childrenByParent.set(definition.parentId, siblings);
  }

  const visiting: string[] = [];
  const complete = new Set<string>();
  function visit(routeId: string): void {
    if (complete.has(routeId)) return;
    const cycleStart = visiting.indexOf(routeId);
    if (cycleStart >= 0) {
      const cycle = [...visiting.slice(cycleStart), routeId];
      throw routeError(routeId, `forms a parent cycle: ${cycle.join(" -> ")}`);
    }
    visiting.push(routeId);
    const parentId = registry[routeId]?.parentId;
    if (parentId) visit(parentId);
    visiting.pop();
    complete.add(routeId);
  }
  for (const [routeId] of entries) visit(routeId);

  for (const [routeId, definition] of entries) {
    const childIds = childrenByParent.get(routeId) ?? [];
    const indexChildIds = childIds.filter(childId => registry[childId]?.index);
    if (definition.index && childIds.length > 0) {
      throw routeError(routeId, `is an index route and cannot own child route "${childIds[0]}"`);
    }
    if (indexChildIds.length > 1) {
      throw routeError(routeId, `has multiple index children: ${indexChildIds.join(", ")}`);
    }

    const defaultChildId = effectiveDefaultChildId(definition, routeId, metadata);
    if (!defaultChildId) continue;
    if (indexChildIds.length > 0) {
      throw routeError(routeId, `cannot use default child "${defaultChildId}" with index child "${indexChildIds[0]}"`);
    }
    const defaultChild = registry[defaultChildId];
    if (!defaultChild) {
      throw routeError(routeId, `references unknown default child "${defaultChildId}"`);
    }
    if (defaultChild.parentId !== routeId) {
      throw routeError(routeId, `default child "${defaultChildId}" must be a direct child`);
    }
    const destination = routeDestinationFromRegistry(registry, defaultChildId);
    const parentPath = definition.index ? "/" : `/${concretePath(definition.path)}`;
    if (destination === parentPath) {
      throw routeError(routeId, `default child "${defaultChildId}" resolves back to its parent`);
    }
    if (destination.includes(":") || destination.includes("*")) {
      throw routeError(routeId, `default child "${defaultChildId}" has unresolved destination "${destination}"`);
    }
    if (
      routeIsEnabledInRegistry(registry, routeId, isDevelopment) &&
      !routeIsEnabledInRegistry(registry, defaultChildId, isDevelopment)
    ) {
      throw routeError(routeId, `default child "${defaultChildId}" is not enabled in this environment`);
    }
  }
}

function resolveRouteTitle(
  definition: AppRouteDefinition,
  translations: AppRouteTranslations,
  params: Readonly<Params<string>>,
): string {
  return definition.translationNamespace === "development-guide"
    ? definition.title(translations.developmentGuide, params)
    : definition.title(translations.app, params);
}

function createRouteObject(
  registry: AppRouteRegistry,
  routeId: string,
  ancestors: readonly string[],
  path: string | undefined,
  isDevelopment: boolean,
  metadata: AppRouteHierarchyMetadata,
): AppRouteObject {
  const definition = registry[routeId];
  if (!definition) throw routeError(routeId, "is not registered");
  const breadcrumbs = definition.breadcrumbs;
  const implementation = "Component" in definition ? { Component: definition.Component } : { lazy: definition.lazy };
  const location = definition.index ? { index: true as const } : { path: path ?? definition.path };

  return {
    ...(definition.ErrorBoundary ? { ErrorBoundary: definition.ErrorBoundary } : {}),
    ...implementation,
    ...location,
    handle: {
      contentMaxWidth: definition.contentMaxWidth,
      contentOverflow: definition.contentOverflow,
      mobileBottomNavigation: definition.mobileBottomNavigation,
      mobileSurface: definition.mobileSurface,
      HeaderContext: definition.HeaderContext,
      ...(definition.headerNavigation
        ? {
            sectionNavigation: Object.entries(registry).flatMap(([childId, child]) => {
              if (
                child.parentId !== routeId ||
                !child.navigation ||
                child.index ||
                !routeIsEnabledInRegistry(registry, childId, isDevelopment)
              )
                return [];
              const link = {
                ...(child.navigation.activePath ? { activePath: child.navigation.activePath } : {}),
                Icon: child.navigation.Icon,
                kind: "link" as const,
                labelKey: child.navigation.labelKey,
                labelNamespace: child.translationNamespace ?? "translation",
                to: routeDestinationFromRegistry(registry, childId),
              };
              return [link as AppNavigationLink];
            }),
          }
        : {}),
      ...(metadata[routeId]?.documentationGroups
        ? {
            documentationGroups: metadata[routeId].documentationGroups,
          }
        : {}),
      resolveBreadcrumbs:
        breadcrumbs === false
          ? () => []
          : (translations, params) => [
              ...ancestors.map(ancestorId => {
                const ancestor = registry[ancestorId];
                if (!ancestor) {
                  throw routeError(ancestorId, "is not registered");
                }
                return {
                  label: resolveRouteTitle(ancestor, translations, params),
                  to: routeDestinationWithParams(registry, ancestorId, params),
                };
              }),
              ...(breadcrumbs ?? []).map(breadcrumb => ({
                label:
                  breadcrumb.translationNamespace === "development-guide"
                    ? breadcrumb.title(translations.developmentGuide, params)
                    : breadcrumb.title(translations.app, params),
                to: breadcrumb.to(params),
              })),
              { label: resolveRouteTitle(definition, translations, params) },
            ],
      resolveTitle: (translations, params) => resolveRouteTitle(definition, translations, params),
      scrollToTop: definition.scrollToTop ?? false,
    },
  } as AppRouteObject;
}

export function createAppRouteObjects(
  registry: AppRouteRegistry,
  access: AppRouteAccess,
  options: RouteHierarchyOptions = {},
): AppRouteObject[] {
  const isDevelopment = options.isDevelopment ?? import.meta.env.DEV;
  const metadata = options.metadata ?? {};
  validateAppRouteRegistry(registry, { isDevelopment, metadata });

  const entries = Object.entries(registry);
  function compose(routeId: string, ancestors: readonly string[], relativePath?: string): AppRouteObject {
    const definition = registry[routeId];
    if (!definition) throw routeError(routeId, "is not registered");
    const route = createRouteObject(registry, routeId, ancestors, relativePath, isDevelopment, metadata);
    const children = entries.filter(
      ([childId, candidate]) =>
        candidate.parentId === routeId && routeIsEnabledInRegistry(registry, childId, isDevelopment),
    );
    if (children.length === 0) return route;

    const defaultChildId = effectiveDefaultChildId(definition, routeId, metadata);
    const childRoutes = children.map(([childId, childDefinition]) =>
      compose(
        childId,
        [...ancestors, routeId],
        childDefinition.index ? undefined : childPath(routeId, definition, childId, childDefinition),
      ),
    );
    return {
      ...route,
      children: [
        ...(defaultChildId
          ? [
              {
                element: <Navigate replace to={routeDestinationFromRegistry(registry, defaultChildId)} />,
                index: true as const,
              },
            ]
          : []),
        ...childRoutes,
      ],
    } as AppRouteObject;
  }

  return entries
    .filter(
      ([routeId, definition]) =>
        definition.access === access &&
        definition.parentId === undefined &&
        routeIsEnabledInRegistry(registry, routeId, isDevelopment),
    )
    .map(([routeId]) => compose(routeId, []));
}
