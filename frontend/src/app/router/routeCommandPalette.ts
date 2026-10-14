import type { AppCommandPaletteEntry } from "@/app/shell/types/AppCommandPaletteEntry";
import { parsePath } from "react-router";
import { routeDestinationFromRegistry, routeIsEnabledInRegistry, type AppRouteRegistry } from "./routeHierarchy";
import type { AppRouteDefinition, AppRouteTranslations } from "./types/AppRoute";

function staticLabel(definition: AppRouteDefinition, translations: AppRouteTranslations): string | undefined {
  if (definition.translationNamespace === "development-guide") {
    if (definition.navigation) return translations.developmentGuide(definition.navigation.labelKey);
    if (!definition.index && /[:*]/.test(definition.path)) return undefined;
    return definition.title(translations.developmentGuide, {});
  }
  if (definition.navigation) return translations.app(definition.navigation.labelKey);
  if (!definition.index && /[:*]/.test(definition.path)) return undefined;
  return definition.title(translations.app, {});
}

function isConcreteApplicationDestination(destination: string): boolean {
  const pathname = parsePath(destination).pathname ?? "";
  return (
    pathname.startsWith("/") &&
    !pathname.startsWith("//") &&
    !/[\\:*]/.test(pathname) &&
    !Array.from(destination).some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
  );
}

/** Membership is explicit; availability follows the registry's inherited policy. */
export function createAppCommandPaletteEntries(
  registry: AppRouteRegistry,
  translations: AppRouteTranslations,
  isDevelopment = import.meta.env.DEV,
): readonly AppCommandPaletteEntry[] {
  const seen = new Set<string>();
  return Object.entries(registry).flatMap(([id, definition]) => {
    if (
      !definition.commandPalette ||
      definition.access !== "authenticated" ||
      !routeIsEnabledInRegistry(registry, id, isDevelopment) ||
      (!definition.index && /^(\/)?\*$/.test(definition.path))
    )
      return [];

    const to = routeDestinationFromRegistry(registry, id);
    if (!isConcreteApplicationDestination(to) || seen.has(to)) return [];
    // Index titles below parameterized parents also lack the parameters needed for evaluation.
    const ancestors: AppRouteDefinition[] = [];
    for (let parentId = definition.parentId; parentId; parentId = registry[parentId]?.parentId) {
      ancestors.unshift(registry[parentId]!);
    }
    if (
      definition.index &&
      !definition.navigation &&
      ancestors.some(ancestor => !ancestor.index && /[:*]/.test(ancestor.path))
    )
      return [];
    const label = staticLabel(definition, translations);
    if (!label) return [];
    seen.add(to);
    return [
      { context: ancestors.flatMap(ancestor => staticLabel(ancestor, translations) ?? []).join(" / "), id, label, to },
    ];
  });
}
