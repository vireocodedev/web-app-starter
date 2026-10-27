import * as React from "react";
import * as ReactJsxRuntime from "react/jsx-runtime";
import * as ReactQuery from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ts from "typescript";
import { afterEach, describe, expect, it, vi } from "vitest";

import tutorial from "../../../docs/storybook/authentication/CapabilityAwarePages/CapabilityAwarePages.mdx?raw";

type PageAccess = Readonly<{ viewerId: string; pages: Readonly<{ reviews: boolean }> }>;
type QueryFactory = (viewerId: string) => ReturnType<typeof ReactQuery.queryOptions<PageAccess>>;
type Observation = Readonly<{
  access: PageAccess | null;
  state: "loading" | "error" | "ready";
  retry: () => void;
}>;
const AuthContext = React.createContext({ user: { id: "alice" }, status: "authenticated" });
function useTestAuth() {
  return React.useContext(AuthContext);
}

// Execute the exact consumer recipe, rather than a separately maintained copy.
// Imports resolve only to these real dependencies and the injected identity owner.
const providerSource = tutorial.match(
  /```tsx\n\/\/ src\/app\/auth\/components\/PageAccessProvider\.tsx\n([\s\S]*?)\n```/,
)?.[1];
if (!providerSource) throw new Error("PageAccessProvider recipe is missing");
const output = ts.transpileModule(providerSource, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const dependencies: Record<string, unknown> = {
  react: React,
  "react/jsx-runtime": ReactJsxRuntime,
  "@tanstack/react-query": ReactQuery,
  "../hooks/useAppAuth": { useAppAuth: useTestAuth },
};
const recipe = {} as {
  PageAccessProvider: React.ComponentType<
    React.PropsWithChildren<{ query: QueryFactory; revokeReviews: (viewerId: string) => Promise<void> }>
  >;
  usePageAccess: () => Observation;
};
new Function("require", "exports", output)((name: string) => {
  if (!(name in dependencies)) throw new Error(`Unexpected recipe dependency: ${name}`);
  return dependencies[name];
}, recipe);

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function Probe() {
  const observation = recipe.usePageAccess();
  return (
    <>
      <output aria-label="Access state">{observation.state}</output>
      <output aria-label="Access projection">
        {observation.access
          ? `${observation.access.viewerId}:${observation.access.pages.reviews ? "allowed" : "denied"}`
          : "none"}
      </output>
      <button onClick={observation.retry}>Retry access check</button>
    </>
  );
}

const clients: ReactQuery.QueryClient[] = [];
afterEach(() => {
  for (const client of clients.splice(0)) client.clear();
});

function mountRecipe(query: QueryFactory, revokeReviews: (viewerId: string) => Promise<void>) {
  const client = new ReactQuery.QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  function Tree({ viewerId }: Readonly<{ viewerId: string }>) {
    return (
      <ReactQuery.QueryClientProvider client={client}>
        <AuthContext.Provider value={{ user: { id: viewerId }, status: "authenticated" }}>
          <recipe.PageAccessProvider query={query} revokeReviews={revokeReviews}>
            <Probe />
          </recipe.PageAccessProvider>
        </AuthContext.Provider>
      </ReactQuery.QueryClientProvider>
    );
  }
  const mounted = render(<Tree viewerId="alice" />);
  return { changeViewer: (viewerId: string) => mounted.rerender(<Tree viewerId={viewerId} />) };
}

function expectObservation(state: Observation["state"], projection: string) {
  expect(screen.getByLabelText("Access state")).toHaveTextContent(state);
  expect(screen.getByLabelText("Access projection")).toHaveTextContent(projection);
}

describe("documented PageAccessProvider cleanup recovery", () => {
  it("retries failed cleanup before exposing a newly allowed projection", async () => {
    const cleanupRetry = deferred();
    const read = vi
      .fn<() => Promise<PageAccess>>()
      .mockResolvedValueOnce({ viewerId: "alice", pages: { reviews: false } })
      .mockResolvedValue({ viewerId: "alice", pages: { reviews: true } });
    const revokeReviews = vi
      .fn<(viewerId: string) => Promise<void>>()
      .mockRejectedValueOnce(new Error("Cleanup unavailable"))
      .mockReturnValue(cleanupRetry.promise);
    mountRecipe(
      viewerId => ReactQuery.queryOptions<PageAccess>({ queryKey: ["page-access", viewerId], queryFn: read }),
      revokeReviews,
    );
    await waitFor(() => expectObservation("error", "none"));

    fireEvent.click(screen.getByRole("button", { name: "Retry access check" }));

    await waitFor(() => {
      expect(read).toHaveBeenCalledTimes(2);
      expect(revokeReviews).toHaveBeenCalledTimes(2);
      expectObservation("loading", "none");
    });
    await act(async () => cleanupRetry.resolve());
    await waitFor(() => expectObservation("ready", "alice:allowed"));
    expect(revokeReviews.mock.calls).toEqual([["alice"], ["alice"]]);
  });

  it("retries cleanup when refetch structurally shares the same denial", async () => {
    const denial = { viewerId: "alice", pages: { reviews: false } };
    const read = vi.fn<() => Promise<PageAccess>>().mockResolvedValue(denial);
    const revokeReviews = vi
      .fn<(viewerId: string) => Promise<void>>()
      .mockRejectedValueOnce(new Error("Cleanup unavailable"))
      .mockResolvedValue(undefined);
    mountRecipe(
      viewerId => ReactQuery.queryOptions<PageAccess>({ queryKey: ["page-access", viewerId], queryFn: read }),
      revokeReviews,
    );
    await waitFor(() => expectObservation("error", "none"));

    fireEvent.click(screen.getByRole("button", { name: "Retry access check" }));

    await waitFor(() => expectObservation("ready", "alice:denied"));
    expect(read).toHaveBeenCalledTimes(2);
    expect(revokeReviews).toHaveBeenCalledTimes(2);
  });

  it.each(["resolve", "reject"] as const)("ignores an old viewer's late cleanup %s", async outcome => {
    const alice = deferred();
    const bob = deferred();
    const revokeReviews = vi.fn((viewerId: string) => (viewerId === "alice" ? alice.promise : bob.promise));
    const { changeViewer } = mountRecipe(
      viewerId =>
        ReactQuery.queryOptions<PageAccess>({
          queryKey: ["page-access", viewerId],
          queryFn: async () => ({ viewerId, pages: { reviews: false } }),
        }),
      revokeReviews,
    );
    await waitFor(() => expect(revokeReviews).toHaveBeenCalledWith("alice"));
    changeViewer("bob");
    await waitFor(() => expect(revokeReviews).toHaveBeenCalledWith("bob"));

    await act(async () => {
      if (outcome === "resolve") alice.resolve();
      else alice.reject(new Error("Obsolete cleanup failure"));
    });

    expectObservation("loading", "none");
    await act(async () => bob.resolve());
    await waitFor(() => expectObservation("ready", "bob:denied"));
    expect(revokeReviews).toHaveBeenCalledTimes(2);
  });
});
