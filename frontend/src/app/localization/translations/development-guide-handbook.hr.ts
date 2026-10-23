import type { StringLeaves } from "../types/TranslationShape.ts";
import type { englishHandbookTranslations } from "./development-guide-handbook.en.ts";

import { croatianBackendHandbookTranslations } from "./handbook/backend.hr.ts";
import { croatianCiHandbookTranslations } from "./handbook/ci.hr.ts";
import { croatianDeliveryHandbookTranslations } from "./handbook/delivery.hr.ts";
import { croatianDeveloperWorkflowHandbookTranslations } from "./handbook/developer-workflow.hr.ts";
import { croatianAgentWorkflowHandbookTranslations } from "./handbook/agent-workflow.hr.ts";
import { croatianFrontendHandbookTranslations } from "./handbook/frontend.hr.ts";

// Imported branches are plain literal data without getters; aggregation only allocates an object.
export const croatianHandbookTranslations = /* @__PURE__ */ (() =>
  ({
    navigation: {
      index: "Teme: {{category}}",
      choosePage: "Odaberite članak, trenutačni članak: {{page}}",
      closePages: "Zatvori članke",
      pageNavigation: "Navigacija članaka",
      contents: "Sadržaj članka",
      related: "Povezano čitanje",
    },
    implementation: {
      starter: "Ugrađeni obrazac",
      reference: "Referentni recept",
      mixed: "Ugrađeno + referentni recept",
    },
    size: {
      small: "Mali obrazac",
      medium: "Srednji obrazac",
      large: "Veliki obrazac",
    },
    categories: {
      ...croatianBackendHandbookTranslations.categories,
      ...croatianCiHandbookTranslations.categories,
      ...croatianDeliveryHandbookTranslations.categories,
      ...croatianDeveloperWorkflowHandbookTranslations.categories,
      ...croatianAgentWorkflowHandbookTranslations.categories,
      ...croatianFrontendHandbookTranslations.categories,
    },
    topics: {
      ...croatianBackendHandbookTranslations.topics,
      ...croatianCiHandbookTranslations.topics,
      ...croatianDeliveryHandbookTranslations.topics,
      ...croatianDeveloperWorkflowHandbookTranslations.topics,
      ...croatianAgentWorkflowHandbookTranslations.topics,
      ...croatianFrontendHandbookTranslations.topics,
    },
    articles: {
      ...croatianBackendHandbookTranslations.articles,
      ...croatianCiHandbookTranslations.articles,
      ...croatianDeliveryHandbookTranslations.articles,
      ...croatianDeveloperWorkflowHandbookTranslations.articles,
      ...croatianAgentWorkflowHandbookTranslations.articles,
      ...croatianFrontendHandbookTranslations.articles,
    },
  }) satisfies StringLeaves<typeof englishHandbookTranslations>)();
