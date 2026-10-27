import { MutationObserver, QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import type { ServerDataExampleApi } from "../../../../../docs/storybook/patterns/ServerData/api/serverData.api";
import { createServerDataExampleMutation } from "../../../../../docs/storybook/patterns/ServerData/api/serverData.mutation";
import { ServerDataExampleQueryKey } from "../../../../../docs/storybook/patterns/ServerData/api/serverData.querykeys";

describe("ServerDataExampleMutation", () => {
  it("writes returned detail data and invalidates every collection query", async () => {
    const updated = {
      id: "atlas",
      name: "Atlas rollout",
      status: "paused",
    } as const;
    const api: ServerDataExampleApi = {
      findAll: vi.fn(),
      updateStatus: vi.fn().mockResolvedValue(updated),
    };
    const queryClient = new QueryClient();
    const listKey = ServerDataExampleQueryKey.list({ page: 1 });
    queryClient.setQueryData(listKey, { items: [], total: 0 });
    const observer = new MutationObserver(queryClient, createServerDataExampleMutation(api, queryClient).updateStatus);

    await observer.mutate({ id: "atlas", status: "paused" });

    expect(api.updateStatus).toHaveBeenCalledWith("atlas", "paused");
    expect(queryClient.getQueryData(ServerDataExampleQueryKey.detail("atlas"))).toEqual(updated);
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true);
  });
});
