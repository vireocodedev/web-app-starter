import { queryOptions } from "@tanstack/react-query";

import type { AppAuthApi } from "./appAuth.api";
import { AppAuthQueryKey } from "./appAuth.querykeys";

export const AppAuthQuery = {
  session(getSession: AppAuthApi["getSession"]) {
    return queryOptions({
      queryFn: getSession,
      queryKey: AppAuthQueryKey.session(),
      retry: false,
      staleTime: 30_000,
    });
  },
} as const;
