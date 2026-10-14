import type { ParseKeys } from "i18next";

import addChangeOrRemoveAFeatureEn from "../../../../../docs/architecture/en/add-change-or-remove-a-feature.md?raw";
import apisModelsQueriesAndMutationsEn from "../../../../../docs/architecture/en/apis-models-queries-and-mutations.md?raw";
import authenticationAndSessionEn from "../../../../../docs/architecture/en/authentication-and-session.md?raw";
import dependencyBoundariesAndImportsEn from "../../../../../docs/architecture/en/dependency-boundaries-and-imports.md?raw";
import entryPointToRenderedApplicationEn from "../../../../../docs/architecture/en/entry-point-to-rendered-application.md?raw";
import featureAnatomyFilenamesAndPublicInterfacesEn from "../../../../../docs/architecture/en/feature-anatomy-filenames-and-public-interfaces.md?raw";
import featureInventoryAndResponsibilitiesEn from "../../../../../docs/architecture/en/feature-inventory-and-responsibilities.md?raw";
import httpQueryAndBrowserStorageEn from "../../../../../docs/architecture/en/http-query-and-browser-storage.md?raw";
import localizationThemeAndPreferencesEn from "../../../../../docs/architecture/en/localization-theme-and-preferences.md?raw";
import routeEntriesAndFeatureCompositionEn from "../../../../../docs/architecture/en/route-entries-and-feature-composition.md?raw";
import routerAndShellResponsibilitiesEn from "../../../../../docs/architecture/en/router-and-shell-responsibilities.md?raw";
import runtimeProvidersAndLifetimesEn from "../../../../../docs/architecture/en/runtime-providers-and-lifetimes.md?raw";
import sourceMapAndOwnershipEn from "../../../../../docs/architecture/en/source-map-and-ownership.md?raw";
import stateOwnershipAndSignalLifecycleEn from "../../../../../docs/architecture/en/state-ownership-and-signal-lifecycle.md?raw";
import testsMocksStoriesAndArchitectureChecksEn from "../../../../../docs/architecture/en/tests-mocks-stories-and-architecture-checks.md?raw";
import addChangeOrRemoveAFeatureHr from "../../../../../docs/architecture/hr/add-change-or-remove-a-feature.md?raw";
import apisModelsQueriesAndMutationsHr from "../../../../../docs/architecture/hr/apis-models-queries-and-mutations.md?raw";
import authenticationAndSessionHr from "../../../../../docs/architecture/hr/authentication-and-session.md?raw";
import dependencyBoundariesAndImportsHr from "../../../../../docs/architecture/hr/dependency-boundaries-and-imports.md?raw";
import entryPointToRenderedApplicationHr from "../../../../../docs/architecture/hr/entry-point-to-rendered-application.md?raw";
import featureAnatomyFilenamesAndPublicInterfacesHr from "../../../../../docs/architecture/hr/feature-anatomy-filenames-and-public-interfaces.md?raw";
import featureInventoryAndResponsibilitiesHr from "../../../../../docs/architecture/hr/feature-inventory-and-responsibilities.md?raw";
import httpQueryAndBrowserStorageHr from "../../../../../docs/architecture/hr/http-query-and-browser-storage.md?raw";
import localizationThemeAndPreferencesHr from "../../../../../docs/architecture/hr/localization-theme-and-preferences.md?raw";
import routeEntriesAndFeatureCompositionHr from "../../../../../docs/architecture/hr/route-entries-and-feature-composition.md?raw";
import routerAndShellResponsibilitiesHr from "../../../../../docs/architecture/hr/router-and-shell-responsibilities.md?raw";
import runtimeProvidersAndLifetimesHr from "../../../../../docs/architecture/hr/runtime-providers-and-lifetimes.md?raw";
import sourceMapAndOwnershipHr from "../../../../../docs/architecture/hr/source-map-and-ownership.md?raw";
import stateOwnershipAndSignalLifecycleHr from "../../../../../docs/architecture/hr/state-ownership-and-signal-lifecycle.md?raw";
import testsMocksStoriesAndArchitectureChecksHr from "../../../../../docs/architecture/hr/tests-mocks-stories-and-architecture-checks.md?raw";

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
  markdown: Readonly<{ en: string; hr: string }>;
  relatedPatternRouteIds?: readonly string[];
}>;

export const architectureArticleCatalog = [
  {
    groupId: "startHere",
    id: "source-map-and-ownership",
    labelKey: "architectureGuide.articles.sourceMapAndOwnership",
    markdown: { en: sourceMapAndOwnershipEn, hr: sourceMapAndOwnershipHr },
  },
  {
    groupId: "startHere",
    id: "dependency-boundaries-and-imports",
    labelKey: "architectureGuide.articles.dependencyBoundariesAndImports",
    markdown: {
      en: dependencyBoundariesAndImportsEn,
      hr: dependencyBoundariesAndImportsHr,
    },
  },
  {
    groupId: "startup",
    id: "entry-point-to-rendered-application",
    labelKey: "architectureGuide.articles.entryPointToRenderedApplication",
    markdown: {
      en: entryPointToRenderedApplicationEn,
      hr: entryPointToRenderedApplicationHr,
    },
  },
  {
    groupId: "startup",
    id: "runtime-providers-and-lifetimes",
    labelKey: "architectureGuide.articles.runtimeProvidersAndLifetimes",
    markdown: {
      en: runtimeProvidersAndLifetimesEn,
      hr: runtimeProvidersAndLifetimesHr,
    },
    relatedPatternRouteIds: ["applicationStateEffectsAndCleanup"],
  },
  {
    groupId: "application",
    id: "http-query-and-browser-storage",
    labelKey: "architectureGuide.articles.httpQueryAndBrowserStorage",
    markdown: {
      en: httpQueryAndBrowserStorageEn,
      hr: httpQueryAndBrowserStorageHr,
    },
    relatedPatternRouteIds: ["serverDataQueryStates"],
  },
  {
    groupId: "application",
    id: "authentication-and-session",
    labelKey: "architectureGuide.articles.authenticationAndSession",
    markdown: {
      en: authenticationAndSessionEn,
      hr: authenticationAndSessionHr,
    },
  },
  {
    groupId: "application",
    id: "router-and-shell-responsibilities",
    labelKey: "architectureGuide.articles.routerAndShellResponsibilities",
    markdown: {
      en: routerAndShellResponsibilitiesEn,
      hr: routerAndShellResponsibilitiesHr,
    },
  },
  {
    groupId: "application",
    id: "localization-theme-and-preferences",
    labelKey: "architectureGuide.articles.localizationThemeAndPreferences",
    markdown: {
      en: localizationThemeAndPreferencesEn,
      hr: localizationThemeAndPreferencesHr,
    },
    relatedPatternRouteIds: ["localizedMuiControls"],
  },
  {
    groupId: "features",
    id: "feature-inventory-and-responsibilities",
    labelKey: "architectureGuide.articles.featureInventoryAndResponsibilities",
    markdown: {
      en: featureInventoryAndResponsibilitiesEn,
      hr: featureInventoryAndResponsibilitiesHr,
    },
  },
  {
    groupId: "features",
    id: "feature-anatomy-filenames-and-public-interfaces",
    labelKey: "architectureGuide.articles.featureAnatomyFilenamesAndPublicInterfaces",
    markdown: {
      en: featureAnatomyFilenamesAndPublicInterfacesEn,
      hr: featureAnatomyFilenamesAndPublicInterfacesHr,
    },
  },
  {
    groupId: "features",
    id: "apis-models-queries-and-mutations",
    labelKey: "architectureGuide.articles.apisModelsQueriesAndMutations",
    markdown: {
      en: apisModelsQueriesAndMutationsEn,
      hr: apisModelsQueriesAndMutationsHr,
    },
    relatedPatternRouteIds: ["serverDataMutationsAndRefresh", "serverDataOptimisticUpdatesAndRollback"],
  },
  {
    groupId: "features",
    id: "state-ownership-and-signal-lifecycle",
    labelKey: "architectureGuide.articles.stateOwnershipAndSignalLifecycle",
    markdown: {
      en: stateOwnershipAndSignalLifecycleEn,
      hr: stateOwnershipAndSignalLifecycleHr,
    },
    relatedPatternRouteIds: ["applicationStateSourceAndComputedSignals"],
  },
  {
    groupId: "pages",
    id: "route-entries-and-feature-composition",
    labelKey: "architectureGuide.articles.routeEntriesAndFeatureComposition",
    markdown: {
      en: routeEntriesAndFeatureCompositionEn,
      hr: routeEntriesAndFeatureCompositionHr,
    },
    relatedPatternRouteIds: ["routingNestedRoutes"],
  },
  {
    groupId: "contributing",
    id: "add-change-or-remove-a-feature",
    labelKey: "architectureGuide.articles.addChangeOrRemoveAFeature",
    markdown: {
      en: addChangeOrRemoveAFeatureEn,
      hr: addChangeOrRemoveAFeatureHr,
    },
  },
  {
    groupId: "contributing",
    id: "tests-mocks-stories-and-architecture-checks",
    labelKey: "architectureGuide.articles.testsMocksStoriesAndArchitectureChecks",
    markdown: {
      en: testsMocksStoriesAndArchitectureChecksEn,
      hr: testsMocksStoriesAndArchitectureChecksHr,
    },
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
