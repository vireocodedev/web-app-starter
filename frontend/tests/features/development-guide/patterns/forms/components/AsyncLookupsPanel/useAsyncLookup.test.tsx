import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAsyncLookup } from "@/features/development-guide/patterns/forms/components/AsyncLookupsPanel/useAsyncLookup";
import type {
  LookupDepartment,
  LookupFilters,
  LookupPerson,
} from "@/features/development-guide/patterns/forms/models/AsyncLookup";

const requests = vi.hoisted(
  () =>
    [] as {
      filters: LookupFilters;
      signal: AbortSignal;
      resolve: (people: readonly LookupPerson[]) => void;
    }[],
);
vi.mock("@/features/development-guide/patterns/forms/api/asyncLookup.api", () => ({
  createAsyncLookupApi: () => ({
    // Deliberately ignore cancellation here to simulate a late transport response.
    findPeople: (filters: LookupFilters, signal: AbortSignal) =>
      new Promise<readonly LookupPerson[]>(resolve => requests.push({ filters, signal, resolve })),
  }),
}));

beforeEach(() => {
  requests.length = 0;
});

function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient();
});

describe("lookup query lifecycle", () => {
  it("aborts obsolete searches and unmounts; a late old-department result cannot replace current data", async () => {
    const { result, rerender, unmount } = renderHook(
      ({ department }: { department: LookupDepartment }) => useAsyncLookup(department),
      {
        initialProps: { department: "engineering" as LookupDepartment },
        wrapper,
      },
    );
    expect(requests).toHaveLength(1);
    act(() => result.current.setSearch("Ada"));
    expect(requests[0]!.signal.aborted).toBe(true);
    expect(requests[1]!.filters).toEqual({
      department: "engineering",
      search: "Ada",
    });
    rerender({ department: "operations" });
    expect(requests[1]!.signal.aborted).toBe(true);
    const lin: LookupPerson = {
      id: "lin",
      label: "Lin Lanying",
      department: "operations",
    };
    await act(async () => requests[2]!.resolve([lin]));
    await waitFor(() => expect(result.current.result.data).toEqual([lin]));
    await act(async () => requests[1]!.resolve([{ id: "ada", label: "Ada Lovelace", department: "engineering" }]));
    expect(result.current.result.data).toEqual([lin]);
    act(() => result.current.setSearch("Katherine"));
    unmount();
    expect(requests[3]!.signal.aborted).toBe(true);
    client.clear();
  });
});
