import { englishBackendHandbookTranslations } from "./handbook/backend.en.ts";
import { englishQualityHandbookTranslations } from "./handbook/quality.en.ts";
import { englishCiHandbookTranslations } from "./handbook/ci.en.ts";
import { englishDeliveryHandbookTranslations } from "./handbook/delivery.en.ts";
import { englishDeveloperWorkflowHandbookTranslations } from "./handbook/developer-workflow.en.ts";
import { englishAgentWorkflowHandbookTranslations } from "./handbook/agent-workflow.en.ts";
import { englishFrontendHandbookTranslations } from "./handbook/frontend.en.ts";

// Imported branches are plain literal data without getters; aggregation only allocates an object.
export const englishHandbookTranslations = /* @__PURE__ */ (() =>
  ({
    navigation: {
      index: "{{category}} topics",
      choosePage: "Choose an article, current article: {{page}}",
      closePages: "Close articles",
      pageNavigation: "Article navigation",
      contents: "Article contents",
      related: "Related reading",
    },
    loading: {
      message: "Loading this article…",
      progress: "Article loading",
      errorTitle: "This article could not be loaded",
      errorMessage:
        "The selected language or article request failed. You can retry while keeping the current guide location.",
      refreshHint:
        "Retry may still use a failed browser module request. If it keeps failing, refresh the page after the connection or development server is available.",
      retry: "Retry article",
      refresh: "Refresh page",
    },
    finder: {
      action: "Find articles",
      actionCount: "Handbook articles: {{count}}",
      title: "Find handbook articles",
      scope:
        "Search handbook titles, summaries, categories, topics, and source references. Interactive demos and Architecture articles are available through category navigation and page search.",
      inventory: "Articles: {{articles}} · Topics: {{topics}} · Source projects: {{projects}}",
      query: "Search titles, summaries, or source paths",
      category: "Category",
      implementation: "Pattern type",
      size: "Pattern size",
      allCategories: "All categories",
      allImplementations: "All pattern types",
      allSizes: "All pattern sizes",
      clear: "Clear search and filters",
      initial: "Enter a search or choose a category, pattern type, or size to find handbook articles.",
      noMatches: "No matching handbook articles. Try fewer words or clear the filters.",
      resultCount: "Matching articles: {{total}} · Showing: {{shown}}",
      refine: "Showing the first 30 matches. Refine your search or filters to narrow the list.",
      results: "Matching articles",
      resultsNavigation: "Matching handbook articles",
      resultOrder: "Results are grouped by category, with relevance ordering within each group.",
      sourceMatch: "Matching source: {{path}}",
    },
    implementation: {
      starter: "Installed pattern",
      reference: "Reference recipe",
      mixed: "Installed + reference recipe",
    },
    size: {
      small: "Small pattern",
      medium: "Medium pattern",
      large: "Large pattern",
    },
    categories: {
      ...englishBackendHandbookTranslations.categories,
      ...englishQualityHandbookTranslations.categories,
      ...englishCiHandbookTranslations.categories,
      ...englishDeliveryHandbookTranslations.categories,
      ...englishDeveloperWorkflowHandbookTranslations.categories,
      ...englishAgentWorkflowHandbookTranslations.categories,
      ...englishFrontendHandbookTranslations.categories,
    },
    topics: {
      ...englishBackendHandbookTranslations.topics,
      ...englishQualityHandbookTranslations.topics,
      ...englishCiHandbookTranslations.topics,
      ...englishDeliveryHandbookTranslations.topics,
      ...englishDeveloperWorkflowHandbookTranslations.topics,
      ...englishAgentWorkflowHandbookTranslations.topics,
      ...englishFrontendHandbookTranslations.topics,
    },
    articles: {
      ...englishBackendHandbookTranslations.articles,
      ...englishQualityHandbookTranslations.articles,
      ...englishCiHandbookTranslations.articles,
      ...englishDeliveryHandbookTranslations.articles,
      ...englishDeveloperWorkflowHandbookTranslations.articles,
      ...englishAgentWorkflowHandbookTranslations.articles,
      ...englishFrontendHandbookTranslations.articles,
    },
  }) as const)();
