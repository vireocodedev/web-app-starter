import { architectureArticleCatalog } from "../../architecture/ArchitectureReference/catalog/architectureArticles";
import type { HandbookArticleDefinition } from "../../handbook/Handbook/types/HandbookArticle";
import { handbookArticles } from "../../handbook/Handbook/catalog/handbookManifest";
import { englishHandbookTranslations } from "../../handbook/Handbook/localization/development-guide-handbook.en";

export function handbookLabel(key: string): string {
  const value = key
    .replace(/^handbook\./, "")
    .split(".")
    .reduce<unknown>(
      (branch, segment) =>
        branch && typeof branch === "object" ? (branch as Record<string, unknown>)[segment] : undefined,
      englishHandbookTranslations,
    );
  return typeof value === "string" ? value : key;
}

export const referenceArticles = [
  ...handbookArticles.map(article => ({
    kind: "handbook" as const,
    id: article.id,
    contentPath: article.contentPath,
    title: handbookLabel(article.titleKey),
    description: handbookLabel(article.descriptionKey),
    to: `/handbook/${article.contentPath}`,
    sourcePath: `/frontend/docs/development-guide/en/${article.contentPath}.md`,
    article: article as HandbookArticleDefinition,
  })),
  ...architectureArticleCatalog.map(article => ({
    kind: "architecture" as const,
    id: article.id,
    contentPath: article.contentPath,
    title: article.id
      .split("-")
      .map((word, index) => (index ? word : word[0]!.toUpperCase() + word.slice(1)))
      .join(" "),
    description: `Architecture · ${article.groupId}`,
    to: `/architecture/${article.id}`,
    sourcePath: `/frontend/docs/architecture/en/${article.id}.md`,
    article,
  })),
];
export type ReferenceArticle = (typeof referenceArticles)[number];

/** Stable manager destinations for source MDX linked by canonical reference articles. */
export const storybookDocsBySource: Readonly<Record<string, string>> = {
  "/frontend/docs/storybook/architecture/ArchitectureReference/ArchitectureReference.mdx":
    "/?path=/docs/development-guide-architecture-architecture-reference--docs",
  "/frontend/docs/storybook/architecture/DependencyDirection/DependencyDirection.mdx":
    "/?path=/docs/development-guide-architecture-dependency-direction--docs",
  "/frontend/docs/storybook/architecture/PublicModuleApis/PublicModuleApis.mdx":
    "/?path=/docs/development-guide-architecture-public-module-apis--docs",
  "/frontend/docs/storybook/architecture/RuntimeAndState/RuntimeAndState.mdx":
    "/?path=/docs/development-guide-architecture-runtime-and-state-ownership--docs",
  "/frontend/docs/storybook/architecture/SourceOwnership/SourceOwnership.mdx":
    "/?path=/docs/development-guide-architecture-source-ownership--docs",
  "/frontend/docs/storybook/authentication/AuthenticationAndHttp/AuthenticationAndHttp.mdx":
    "/?path=/docs/development-guide-authentication-authentication-and-http-integration--docs",
  "/frontend/docs/storybook/authentication/CapabilityAwarePages/CapabilityAwarePages.mdx":
    "/?path=/docs/development-guide-authentication-capability-aware-pages-and-actions--docs",
  "/frontend/docs/storybook/collections/TablesAndCollections/TablesAndCollections.mdx":
    "/?path=/docs/development-guide-collections-tables-and-collections--docs",
  "/frontend/docs/storybook/data/BackendConnectedFeature/BackendConnectedFeature.mdx":
    "/?path=/docs/development-guide-data-building-a-backend-connected-feature--docs",
  "/frontend/docs/storybook/data/FeatureData/FeatureData.mdx":
    "/?path=/docs/development-guide-data-loading-and-saving-feature-data--docs",
  "/frontend/docs/storybook/examples/Contacts/Contacts.mdx": "/?path=/docs/development-guide-examples-contacts--docs",
  "/frontend/docs/storybook/feedback/Confirmations/Confirmations.mdx":
    "/?path=/docs/development-guide-feedback-confirmations--docs",
  "/frontend/docs/storybook/feedback/Notifications/Notifications.mdx":
    "/?path=/docs/development-guide-feedback-notifications--docs",
  "/frontend/docs/storybook/forms/DraftAndSubmitForms/DraftAndSubmitForms.mdx":
    "/?path=/docs/development-guide-forms-draft-and-submit-forms--docs",
  "/frontend/docs/storybook/forms/EntityForms/EntityForms.mdx":
    "/?path=/docs/development-guide-forms-entity-forms--docs",
  "/frontend/docs/storybook/handbook/Handbook/Handbook.mdx": "/?path=/docs/development-guide-handbook-handbook--docs",
  "/frontend/docs/storybook/localization/LocalizationAndFormatting/LocalizationAndFormatting.mdx":
    "/?path=/docs/development-guide-localization-localization-and-formatting--docs",
  "/frontend/docs/storybook/notifications/PersistedInbox/PersistedInbox.mdx":
    "/?path=/docs/development-guide-notifications-persisted-inboxes-versus-feedback--docs",
  "/frontend/docs/storybook/patterns/ApplicationState/ApplicationState.mdx":
    "/?path=/docs/development-guide-patterns-application-state--docs",
  "/frontend/docs/storybook/patterns/Feedback/Feedback.mdx": "/?path=/docs/development-guide-patterns-feedback--docs",
  "/frontend/docs/storybook/patterns/Forms/Forms.mdx": "/?path=/docs/development-guide-patterns-forms--docs",
  "/frontend/docs/storybook/patterns/Localization/Localization.mdx":
    "/?path=/docs/development-guide-patterns-localization--docs",
  "/frontend/docs/storybook/patterns/Overlays/Overlays.mdx": "/?path=/docs/development-guide-patterns-overlays--docs",
  "/frontend/docs/storybook/patterns/RoutingAndUrlState/RoutingAndUrlState.mdx":
    "/?path=/docs/development-guide-patterns-routing-and-url-state--docs",
  "/frontend/docs/storybook/patterns/ServerData/ServerData.mdx":
    "/?path=/docs/development-guide-patterns-server-data--docs",
  "/frontend/docs/storybook/patterns/TablesAndCollections/TablesAndCollections.mdx":
    "/?path=/docs/development-guide-patterns-tables-and-collections--docs",
  "/frontend/docs/storybook/routing/HeaderTabs/HeaderTabs.mdx":
    "/?path=/docs/development-guide-routing-pages-with-header-tabs--docs",
  "/frontend/docs/storybook/routing/LeftNavigation/LeftNavigation.mdx":
    "/?path=/docs/development-guide-routing-pages-with-left-navigation--docs",
  "/frontend/docs/storybook/routing/NavigationChooser/NavigationChooser.mdx":
    "/?path=/docs/development-guide-routing-navigation-chooser-pages--docs",
  "/frontend/docs/storybook/routing/StandalonePages/StandalonePages.mdx":
    "/?path=/docs/development-guide-routing-standalone-pages--docs",
  "/frontend/docs/storybook/routing/UrlBackedState/UrlBackedState.mdx":
    "/?path=/docs/development-guide-routing-url-backed-state--docs",
  "/frontend/docs/storybook/settings/SettingsAwareComponents/SettingsAwareComponents.mdx":
    "/?path=/docs/development-guide-settings-components-that-respect-application-settings--docs",
  "/frontend/docs/storybook/state/SignalsAndPersistence/SignalsAndPersistence.mdx":
    "/?path=/docs/development-guide-state-signals-and-persistence-in-practice--docs",
  "/frontend/docs/storybook/testing/TestingAFeature/TestingAFeature.mdx":
    "/?path=/docs/development-guide-testing-testing-a-feature--docs",
  "/frontend/docs/storybook/workflows/WorkflowCommands/WorkflowCommands.mdx":
    "/?path=/docs/development-guide-workflows-workflow-commands-conflicts-and-coordinated-refresh--docs",
};

/** Resolve full source paths, preserving separate topics and cross-catalog reading. */
export function resolveReferenceHref(sourcePath: string, href: string | undefined): string | undefined {
  if (!href || href.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//")) return href;
  const target = new URL(href, `https://guide.invalid${sourcePath}`);
  let pathname = decodeURIComponent(target.pathname).replace(/\/hr\//, "/en/");
  if (["/dev-guide", "/dev-guide/find", "/frontend/docs/development-guide/README.md"].includes(pathname))
    return "/handbook";
  if (pathname.startsWith("/dev-guide/frontend/architecture/")) {
    pathname = `/frontend/docs/architecture/en/${pathname.slice("/dev-guide/frontend/architecture/".length)}.md`;
  } else if (pathname.startsWith("/dev-guide/")) {
    const contentPath = pathname.slice("/dev-guide/".length).replace(/^frontend\/workflow-patterns\//, "frontend/");
    pathname = `/frontend/docs/development-guide/en/${contentPath}.md`;
  }
  const tutorial = storybookDocsBySource[pathname];
  if (tutorial) return `${tutorial}${target.hash}`;
  const article = referenceArticles.find(candidate => candidate.sourcePath === pathname);
  if (article) return `${article.to}${target.search}${target.hash}`;
  return href;
}
