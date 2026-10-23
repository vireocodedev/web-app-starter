import type { HandbookArticleDefinition } from "../types/HandbookArticle.ts";

import { backendHandbookCatalog } from "./handbookBackend.ts";
import { ciHandbookCatalog } from "./handbookCi.ts";
import { deliveryHandbookCatalog } from "./handbookDelivery.ts";
import { developerWorkflowHandbookCatalog } from "./handbookDeveloperWorkflow.ts";
import { agentWorkflowHandbookCatalog } from "./handbookAgentWorkflow.ts";
import { frontendHandbookCatalog } from "./handbookFrontend.ts";

/** Category order is declared once; each category owns its topic and article order. */
const orderedHandbookCatalog = [
  backendHandbookCatalog,
  ciHandbookCatalog,
  deliveryHandbookCatalog,
  developerWorkflowHandbookCatalog,
  agentWorkflowHandbookCatalog,
  frontendHandbookCatalog,
] as const;

type CategoryEntry = (typeof orderedHandbookCatalog)[number];
type CatalogCategory = CategoryEntry["category"];
type CatalogTopic = CategoryEntry["topics"][number];
type CatalogArticle = CategoryEntry["articles"][number];

// These transforms only allocate arrays and read literal data; unused guide catalogs stay removable.
export const handbookCategories: readonly CatalogCategory[] = /* @__PURE__ */ orderedHandbookCatalog.map(
  entry => entry.category,
);
export const handbookTopics: readonly CatalogTopic[] = /* @__PURE__ */ orderedHandbookCatalog.flatMap<CatalogTopic>(
  entry => entry.topics,
);
export const handbookArticles: readonly CatalogArticle[] =
  /* @__PURE__ */ orderedHandbookCatalog.flatMap<CatalogArticle>(entry => entry.articles);

export type HandbookCategoryId = (typeof handbookCategories)[number]["id"];
export type HandbookTopicId = (typeof handbookTopics)[number]["id"];
export type HandbookArticleId = (typeof handbookArticles)[number]["id"];

export function handbookArticle(id: HandbookArticleId): HandbookArticleDefinition {
  const article = handbookArticles.find(candidate => candidate.id === id);
  if (!article) throw new Error(`Unknown handbook article: ${id}`);
  return article;
}
