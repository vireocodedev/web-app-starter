import type { ParseKeys } from "i18next";

export type HandbookSource = Readonly<{
  project: string;
  revision: string;
  path: string;
  note?: string;
}>;

export type HandbookCategoryDefinition = Readonly<{
  id: string;
  slug: string;
  titleKey: ParseKeys<"development-guide">;
  descriptionKey: ParseKeys<"development-guide">;
}>;

export type HandbookTopicDefinition = Readonly<{
  id: string;
  categoryId: string;
  slug: string;
  titleKey: ParseKeys<"development-guide">;
  descriptionKey: ParseKeys<"development-guide">;
}>;

export type HandbookArticleDefinition = Readonly<{
  id: string;
  topicId: string;
  slug: string;
  contentPath: string;
  titleKey: ParseKeys<"development-guide">;
  descriptionKey: ParseKeys<"development-guide">;
  implementation: "starter" | "reference" | "mixed";
  size: "small" | "medium" | "large";
  sources: readonly HandbookSource[];
  relatedArticleIds?: readonly string[];
}>;

/** Private authoring bundle; public catalog IDs are inferred from the category literals. */
export type HandbookCategoryCatalog = Readonly<{
  category: HandbookCategoryDefinition;
  topics: readonly HandbookTopicDefinition[];
  articles: readonly HandbookArticleDefinition[];
}>;

export type HandbookRelatedLink = Readonly<{
  labelKey: ParseKeys<"development-guide">;
  to: string;
}>;
