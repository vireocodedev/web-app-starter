import { normalizeServerDataFilters, type ServerDataFilters } from "../models/ServerDataFilters";

const serverDataQueryKeyRoot = ["server-data-patterns"] as const;

/** Keeps example cache entries separate from product-owned query data. */
export const ServerDataExampleQueryKey = {
  all: serverDataQueryKeyRoot,
  collections: () => [...serverDataQueryKeyRoot, "collection"] as const,
  detail: (recordId: string) => [...serverDataQueryKeyRoot, "detail", recordId] as const,
  loadingPreview: () => [...serverDataQueryKeyRoot, "loading-preview"] as const,
  list: (filters: ServerDataFilters = {}) =>
    [...serverDataQueryKeyRoot, "collection", "list", normalizeServerDataFilters(filters)] as const,
} as const;
