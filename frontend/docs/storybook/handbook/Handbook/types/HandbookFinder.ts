import type { ParseKeys } from "i18next";

import type { HandbookArticleId, HandbookCategoryId, HandbookTopicId } from "../catalog/handbookManifest";

/** Destinations and display aliases are supplied by the development router. */
export type HandbookFinderEntry = Readonly<{
  id: HandbookArticleId;
  to: string;
  titleKey: ParseKeys<"development-guide">;
  descriptionKey: ParseKeys<"development-guide">;
  category: Readonly<{ id: HandbookCategoryId; titleKey: ParseKeys<"development-guide"> }>;
  topic: Readonly<{ id: HandbookTopicId; titleKey: ParseKeys<"development-guide"> }>;
  implementation: "starter" | "reference" | "mixed";
  size: "small" | "medium" | "large";
  sources: readonly Readonly<{ project: string; path: string; revision: string }>[];
}>;

export type HandbookFinderFilters = Readonly<{
  q: string;
  category: "all" | HandbookCategoryId;
  implementation: "all" | HandbookFinderEntry["implementation"];
  size: "all" | HandbookFinderEntry["size"];
}>;

export type HandbookFinderProps = Readonly<{
  entries: readonly HandbookFinderEntry[];
  filters: HandbookFinderFilters;
  onFiltersChange: (update: Partial<HandbookFinderFilters>) => void;
}>;
