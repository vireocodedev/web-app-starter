import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";
import type { OptimisticExampleApi, OptimisticRecord, OptimisticSave } from "./optimisticUpdates.api";

export const optimisticExampleKeys = {
  all: ["optimistic-example"] as const,
  list: ["optimistic-example", "list"] as const,
  detail: ["optimistic-example", "detail"] as const,
};

export function createOptimisticExampleQuery(api: OptimisticExampleApi) {
  return {
    list: queryOptions({
      queryKey: optimisticExampleKeys.list,
      queryFn: ({ signal }) => api.list(signal),
    }),
    detail: queryOptions({
      queryKey: optimisticExampleKeys.detail,
      queryFn: ({ signal }) => api.detail(signal),
    }),
  };
}

/** One write at a time; the gallery owns the preview's isolated query cache. */
export function createOptimisticExampleMutation(api: OptimisticExampleApi, client: QueryClient) {
  return mutationOptions({
    mutationFn: (input: OptimisticSave) => api.save(input),
    onMutate: async ({ status }) => {
      await client.cancelQueries({ queryKey: optimisticExampleKeys.all });
      const list = client.getQueryData<readonly OptimisticRecord[]>(optimisticExampleKeys.list);
      const detail = client.getQueryData<OptimisticRecord>(optimisticExampleKeys.detail);
      client.setQueryData<readonly OptimisticRecord[]>(optimisticExampleKeys.list, current =>
        current?.map(record => ({ ...record, status })),
      );
      client.setQueryData<OptimisticRecord>(optimisticExampleKeys.detail, current =>
        current ? { ...current, status } : current,
      );
      return { list, detail };
    },
    onError: (_error, _input, snapshot) => {
      if (!snapshot) return;
      client.setQueryData(optimisticExampleKeys.list, snapshot.list);
      client.setQueryData(optimisticExampleKeys.detail, snapshot.detail);
    },
    onSuccess: record => {
      client.setQueryData(optimisticExampleKeys.detail, record);
      client.setQueryData<readonly OptimisticRecord[]>(optimisticExampleKeys.list, current =>
        current?.map(item => (item.id === record.id ? record : item)),
      );
    },
    onSettled: () => client.invalidateQueries({ queryKey: optimisticExampleKeys.all }),
  });
}
