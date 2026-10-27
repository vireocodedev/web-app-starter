import { queryOptions } from "@tanstack/react-query";

import type { ContactApi } from "./contact.api";
import { ContactQueryKey } from "./contact.querykeys";

/** Query options are created once in the application runtime. */
export function createContactQuery(api: ContactApi) {
  return Object.freeze({
    findAll: () =>
      queryOptions({
        queryFn: ({ signal }) => api.findAll({ signal }),
        queryKey: ContactQueryKey.collection(),
      }),
  });
}

export type ContactQuery = ReturnType<typeof createContactQuery>;
