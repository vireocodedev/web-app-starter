import { englishBackendHandbookTranslations } from "./handbook/backend.en.ts";
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
      ...englishCiHandbookTranslations.categories,
      ...englishDeliveryHandbookTranslations.categories,
      ...englishDeveloperWorkflowHandbookTranslations.categories,
      ...englishAgentWorkflowHandbookTranslations.categories,
      ...englishFrontendHandbookTranslations.categories,
    },
    topics: {
      ...englishBackendHandbookTranslations.topics,
      ...englishCiHandbookTranslations.topics,
      ...englishDeliveryHandbookTranslations.topics,
      ...englishDeveloperWorkflowHandbookTranslations.topics,
      ...englishAgentWorkflowHandbookTranslations.topics,
      ...englishFrontendHandbookTranslations.topics,
    },
    articles: {
      ...englishBackendHandbookTranslations.articles,
      ...englishCiHandbookTranslations.articles,
      ...englishDeliveryHandbookTranslations.articles,
      ...englishDeveloperWorkflowHandbookTranslations.articles,
      ...englishAgentWorkflowHandbookTranslations.articles,
      ...englishFrontendHandbookTranslations.articles,
    },
  }) as const)();
