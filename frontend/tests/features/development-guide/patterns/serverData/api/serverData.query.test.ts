import { describe, expect, it, vi } from "vitest";

import type { ServerDataExampleApi } from "@/features/development-guide/patterns/serverData/api/serverData.api";
import { createServerDataExampleQuery } from "@/features/development-guide/patterns/serverData/api/serverData.query";
import { ServerDataExampleQueryKey } from "@/features/development-guide/patterns/serverData/api/serverData.querykeys";

function createApi(): ServerDataExampleApi {
  return {
    findAll: vi.fn().mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 3,
      total: 0,
    }),
    updateStatus: vi.fn(),
  };
}

describe("ServerDataExampleQuery", () => {
  it("normalizes filters into a distinct feature-owned cache key", () => {
    const query = createServerDataExampleQuery(createApi());

    expect(query.list({ page: 0, search: " atlas " }).queryKey).toEqual(
      ServerDataExampleQueryKey.list({ page: 1, search: "atlas" }),
    );
    expect(ServerDataExampleQueryKey.all).toEqual(["server-data-patterns"]);
  });

  it("forwards TanStack Query cancellation to the API request", async () => {
    const api = createApi();
    const query = createServerDataExampleQuery(api).list({ search: "atlas" });
    const controller = new AbortController();

    await query.queryFn!({
      client: {} as never,
      meta: undefined,
      queryKey: query.queryKey,
      signal: controller.signal,
    });

    expect(api.findAll).toHaveBeenCalledWith(
      {
        outcome: "success",
        page: 1,
        pageSize: 3,
        search: "atlas",
      },
      { signal: controller.signal },
    );
  });
});
