import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

type QueryClientOverrides = Readonly<{
  retry?: (failureCount: number, error: unknown) => boolean;
  retryDelay?: (attempt: number) => number;
}>;

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (axios.isCancel(error) || failureCount >= 2) return false;
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true;

  const status = error.response.status;
  return status === 408 || status === 429 || status >= 500;
}

function queryRetryDelay(attempt: number): number {
  return Math.min(1_000 * 2 ** attempt, 8_000);
}

export function createAppQueryClient(overrides: QueryClientOverrides = {}) {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: {
        gcTime: 5 * 60_000,
        retry: overrides.retry ?? shouldRetryQuery,
        retryDelay: overrides.retryDelay ?? queryRetryDelay,
        staleTime: 30_000,
      },
    },
  });
}
