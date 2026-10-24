import WidgetsOutlinedIcon from "@mui/icons-material/WidgetsOutlined";
import type { ComponentType } from "react";
import { Outlet } from "react-router";

import {
  GeneratedExamplesIndexPage,
  type GeneratedExampleEntry,
} from "@/pages/development-guide/generated/GeneratedExamplesIndexPage";

import type { AppRouteDefinition } from "./types/AppRoute";

type ExampleLoader = () => Promise<{ Component: ComponentType }>;
type GeneratedExampleRouteId = "generatedExamples" | "generatedExamplesIndex" | `generated-example:${string}`;

/** File discovery supplies data to the existing router, with no second matcher or source rewriting. */
export function createGeneratedExampleRoutes(
  loaders: Readonly<Record<string, ExampleLoader>>,
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
    if (routes[id]) throw new Error(`Duplicate generated example route: ${id}`);
    const label = name
      .split("-")
      .map(word => word[0].toUpperCase() + word.slice(1))
      .join(" ");
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
      )
    : {}
) as Record<GeneratedExampleRouteId, AppRouteDefinition>;
