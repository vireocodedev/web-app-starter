import type { ParseKeys } from "i18next";

export const architectureArticleIds = [
  "source-map-and-ownership",
  "dependency-boundaries-and-imports",
  "entry-point-to-rendered-application",
  "runtime-providers-and-lifetimes",
  "http-query-and-browser-storage",
  "authentication-and-session",
  "router-and-shell-responsibilities",
  "localization-theme-and-preferences",
  "feature-inventory-and-responsibilities",
  "feature-anatomy-filenames-and-public-interfaces",
  "apis-models-queries-and-mutations",
  "state-ownership-and-signal-lifecycle",
  "route-entries-and-feature-composition",
  "add-change-or-remove-a-feature",
  "tests-mocks-stories-and-architecture-checks",
] as const;

export type ArchitectureArticleId = (typeof architectureArticleIds)[number];

export type ArchitectureGroupId = "application" | "contributing" | "features" | "pages" | "startHere" | "startup";

type ArchitectureArticle = Readonly<{
  groupId: ArchitectureGroupId;
  id: ArchitectureArticleId;
  labelKey: ParseKeys<"development-guide">;
  contentPath: string;
  relatedPatternRouteIds?: readonly string[];
}>;

export const architectureArticleCatalog = [
  {
    groupId: "startHere",
    id: "source-map-and-ownership",
    labelKey: "architectureGuide.articles.sourceMapAndOwnership",
    contentPath: "source-map-and-ownership",
  },
  {
    groupId: "startHere",
    id: "dependency-boundaries-and-imports",
    labelKey: "architectureGuide.articles.dependencyBoundariesAndImports",
    contentPath: "dependency-boundaries-and-imports",
  },
  {
    groupId: "startup",
    id: "entry-point-to-rendered-application",
    labelKey: "architectureGuide.articles.entryPointToRenderedApplication",
    contentPath: "entry-point-to-rendered-application",
  },
  {
    groupId: "startup",
    id: "runtime-providers-and-lifetimes",
    labelKey: "architectureGuide.articles.runtimeProvidersAndLifetimes",
    contentPath: "runtime-providers-and-lifetimes",
    relatedPatternRouteIds: ["applicationStateEffectsAndCleanup"],
  },
  {
    groupId: "application",
    id: "http-query-and-browser-storage",
    labelKey: "architectureGuide.articles.httpQueryAndBrowserStorage",
    contentPath: "http-query-and-browser-storage",
    relatedPatternRouteIds: ["serverDataQueryStates"],
  },
  {
    groupId: "application",
    id: "authentication-and-session",
    labelKey: "architectureGuide.articles.authenticationAndSession",
    contentPath: "authentication-and-session",
  },
  {
    groupId: "application",
    id: "router-and-shell-responsibilities",
    labelKey: "architectureGuide.articles.routerAndShellResponsibilities",
    contentPath: "router-and-shell-responsibilities",
  },
  {
    groupId: "application",
    id: "localization-theme-and-preferences",
    labelKey: "architectureGuide.articles.localizationThemeAndPreferences",
    contentPath: "localization-theme-and-preferences",
    relatedPatternRouteIds: ["localizedMuiControls"],
  },
  {
    groupId: "features",
    id: "feature-inventory-and-responsibilities",
    labelKey: "architectureGuide.articles.featureInventoryAndResponsibilities",
    contentPath: "feature-inventory-and-responsibilities",
  },
  {
    groupId: "features",
    id: "feature-anatomy-filenames-and-public-interfaces",
    labelKey: "architectureGuide.articles.featureAnatomyFilenamesAndPublicInterfaces",
    contentPath: "feature-anatomy-filenames-and-public-interfaces",
  },
  {
    groupId: "features",
    id: "apis-models-queries-and-mutations",
    labelKey: "architectureGuide.articles.apisModelsQueriesAndMutations",
    contentPath: "apis-models-queries-and-mutations",
    relatedPatternRouteIds: ["serverDataMutationsAndRefresh", "serverDataOptimisticUpdatesAndRollback"],
  },
  {
    groupId: "features",
    id: "state-ownership-and-signal-lifecycle",
    labelKey: "architectureGuide.articles.stateOwnershipAndSignalLifecycle",
    contentPath: "state-ownership-and-signal-lifecycle",
    relatedPatternRouteIds: ["applicationStateSourceAndComputedSignals"],
  },
  {
    groupId: "pages",
    id: "route-entries-and-feature-composition",
    labelKey: "architectureGuide.articles.routeEntriesAndFeatureComposition",
    contentPath: "route-entries-and-feature-composition",
    relatedPatternRouteIds: ["routingNestedRoutes"],
  },
  {
    groupId: "contributing",
    id: "add-change-or-remove-a-feature",
    labelKey: "architectureGuide.articles.addChangeOrRemoveAFeature",
    contentPath: "add-change-or-remove-a-feature",
  },
  {
    groupId: "contributing",
    id: "tests-mocks-stories-and-architecture-checks",
    labelKey: "architectureGuide.articles.testsMocksStoriesAndArchitectureChecks",
    contentPath: "tests-mocks-stories-and-architecture-checks",
  },
] as const satisfies readonly ArchitectureArticle[];

export const architectureGroups = [
  { id: "startHere", labelKey: "architectureGuide.groups.startHere" },
  { id: "startup", labelKey: "architectureGuide.groups.startup" },
  { id: "application", labelKey: "architectureGuide.groups.application" },
  { id: "features", labelKey: "architectureGuide.groups.features" },
  { id: "pages", labelKey: "architectureGuide.groups.pages" },
  { id: "contributing", labelKey: "architectureGuide.groups.contributing" },
] as const satisfies readonly Readonly<{
  id: ArchitectureGroupId;
  labelKey: ParseKeys<"development-guide">;
}>[];

export function architectureArticle(id: ArchitectureArticleId) {
  return architectureArticleCatalog.find(article => article.id === id)!;
}

const markdown = import.meta.glob<string>("../../../../architecture/{en,hr}/*.md", {
  import: "default",
  query: "?raw",
});

/** Inventory keys are validated without fetching bodies; only the selected module loads. */
export async function loadArchitectureMarkdown(id: ArchitectureArticleId, locale: "en" | "hr"): Promise<string> {
  const loader = markdown[`../../../../architecture/${locale}/${id}.md`];
  if (!loader) throw new Error(`Missing architecture article: ${locale}/${id}`);
  return loader();
}
for (const id of architectureArticleIds) {
  for (const locale of ["en", "hr"]) {
    if (!markdown[`../../../../architecture/${locale}/${id}.md`])
      throw new Error(`Missing architecture article: ${locale}/${id}`);
  }
}

if (import.meta.env.DEV && import.meta.hot) {
  // Refresh the native module cache after canonical Markdown changes.
  import.meta.hot.accept(() => window.location.reload());
}
