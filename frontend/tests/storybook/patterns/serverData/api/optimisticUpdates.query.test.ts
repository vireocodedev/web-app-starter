import { MutationObserver, QueryClient, QueryObserver } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  createOptimisticExampleApi,
  type OptimisticExampleApi,
  type OptimisticRecord,
} from "../../../../../docs/storybook/patterns/ServerData/api/optimisticUpdates.api";
import {
  createOptimisticExampleMutation,
  createOptimisticExampleQuery,
  optimisticExampleKeys as keys,
} from "../../../../../docs/storybook/patterns/ServerData/api/optimisticUpdates.query";

const initial: OptimisticRecord = {
  id: "atlas",
  name: "Atlas",
  status: "active",
  revision: 1,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function setup() {
  let server = initial;
  const write = deferred<OptimisticRecord>();
  const api: OptimisticExampleApi = {
    list: vi.fn(async () => [server]),
    detail: vi.fn(async () => server),
    save: vi.fn(() =>
      write.promise.then(record => {
        server = record;
        return record;
      }),
    ),
  };
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(keys.list, [initial]);
  client.setQueryData(keys.detail, initial);
  const queries = createOptimisticExampleQuery(api);
  const offList = new QueryObserver(client, queries.list).subscribe(() => {});
  const offDetail = new QueryObserver(client, queries.detail).subscribe(() => {});
  const mutation = new MutationObserver(client, createOptimisticExampleMutation(api, client));
  return {
    api,
    client,
    mutation,
    write,
    cleanup: () => {
      offList();
      offDetail();
      client.clear();
    },
  };
}

describe("optimistic example mutations", () => {
  it("changes both caches before the response, then reconciles server revision", async () => {
    const test = setup();
    try {
      const pending = test.mutation.mutate({
        status: "paused",
        rejectSave: false,
      });
      await vi.waitFor(() => expect(test.api.save).toHaveBeenCalledOnce());
      expect(test.client.getQueryData(keys.detail)).toEqual({
        ...initial,
        status: "paused",
      });
      expect(test.client.getQueryData(keys.list)).toEqual([{ ...initial, status: "paused" }]);
      expect(test.mutation.getCurrentResult().isPending).toBe(true);
      test.write.resolve({ ...initial, status: "paused", revision: 2 });
      await pending;
      expect(test.client.getQueryData(keys.detail)).toEqual({
        ...initial,
        status: "paused",
        revision: 2,
      });
      expect(test.client.getQueryData(keys.list)).toEqual([{ ...initial, status: "paused", revision: 2 }]);
      expect(test.api.list).toHaveBeenCalledOnce();
      expect(test.api.detail).toHaveBeenCalledOnce();
    } finally {
      test.cleanup();
    }
  });

  it("restores both snapshots before refetching after a rejected save", async () => {
    const test = setup();
    try {
      const pending = test.mutation.mutate({ status: "paused", rejectSave: true }).catch((error: Error) => error);
      await vi.waitFor(() => expect(test.api.save).toHaveBeenCalledOnce());
      const refresh = deferred<readonly OptimisticRecord[]>();
      vi.mocked(test.api.list).mockReturnValue(refresh.promise);
      test.write.reject(new Error("Rejected"));
      await vi.waitFor(() => expect(test.api.list).toHaveBeenCalledOnce());
      expect(test.client.getQueryData(keys.list)).toEqual([initial]);
      expect(test.client.getQueryData(keys.detail)).toEqual(initial);
      refresh.resolve([initial]);
      expect(await pending).toBeInstanceOf(Error);
      expect(test.mutation.getCurrentResult().isError).toBe(true);
    } finally {
      test.cleanup();
    }
  });

  it("cancels stale reads before they can overwrite the optimistic state", async () => {
    const test = setup();
    try {
      let signal: AbortSignal | undefined;
      const oldRead = test.client
        .fetchQuery({
          queryKey: keys.detail,
          staleTime: 0,
          queryFn: context => {
            if (signal) return test.api.detail(context.signal);
            signal = context.signal;
            return new Promise<OptimisticRecord>(() => {});
          },
        })
        .catch(() => undefined);
      const pending = test.mutation.mutate({
        status: "paused",
        rejectSave: false,
      });
      await vi.waitFor(() => expect(test.api.save).toHaveBeenCalledOnce());
      expect(signal?.aborted).toBe(true);
      expect(test.client.getQueryData(keys.detail)).toMatchObject({
        status: "paused",
      });
      await oldRead;
      test.write.resolve({ ...initial, status: "paused", revision: 2 });
      await pending;
    } finally {
      test.cleanup();
    }
  });

  it("keeps deterministic failures repeatable and servers independent", async () => {
    const api = createOptimisticExampleApi(0);
    const sibling = createOptimisticExampleApi(0);
    const signal = new AbortController().signal;
    await expect(api.save({ status: "paused", rejectSave: true })).rejects.toThrow();
    await expect(api.save({ status: "paused", rejectSave: true })).rejects.toThrow();
    expect(await api.detail(signal)).toEqual(initial);
    await api.save({ status: "paused", rejectSave: false });
    expect(await api.detail(signal)).toMatchObject({
      status: "paused",
      revision: 2,
    });
    expect(await sibling.detail(signal)).toEqual(initial);
  });
});
