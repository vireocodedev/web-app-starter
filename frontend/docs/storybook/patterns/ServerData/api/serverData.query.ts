import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import type { ServerDataExampleApi } from "./serverData.api";
import { ServerDataExampleQueryKey } from "./serverData.querykeys";
import { normalizeServerDataFilters, type ServerDataFilters } from "../models/ServerDataFilters";

export function createServerDataExampleQuery(api: ServerDataExampleApi) {
  return Object.freeze({
    list: (filters: ServerDataFilters = {}) => {
      const normalized = normalizeServerDataFilters(filters);

      return queryOptions({
        placeholderData: keepPreviousData,
        queryFn: ({ signal }) => api.findAll(normalized, { signal }),
        queryKey: ServerDataExampleQueryKey.list(normalized),
        retry: false,
        staleTime: 0,
      });
    },
  });
}

export type ServerDataExampleQuery = ReturnType<typeof createServerDataExampleQuery>;
