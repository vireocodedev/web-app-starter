import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";

import { useAppQueryParams } from "@/app/router/hooks/useAppQueryParams";

const schema = z.object({
  q: z.string().default(""),
  page: z
    .codec(z.string().regex(/^\d+$/), z.number().int().positive(), {
      decode: Number,
      encode: String,
    })
    .default(1),
});

function QueryControls() {
  const query = useAppQueryParams(schema);
  return (
    <>
      <output aria-label="Query values">{`${query.get("q")}:${query.values.page}`}</output>
      <button onClick={() => query.set("q", "next")}>Push query</button>
      <button onClick={() => query.set("q", "replacement", { replace: true })}>Replace query</button>
      <button
        onClick={() =>
          query.setValues(values => ({
            q: `${values.q}!`,
            page: values.page + 1,
          }))
        }
      >
        Batch update
      </button>
      <button onClick={() => query.setValues({ q: "", page: 1 })}>Reset query</button>
    </>
  );
}

function mount(initialEntries = ["/dev-guide/frontend/patterns?q=start&page=2&tag=a&tag=b"]) {
  const router = createMemoryRouter([{ path: "/dev-guide/frontend/patterns", Component: QueryControls }], {
    initialEntries,
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe("useAppQueryParams", () => {
  it("uses the router location for push, back, and forward navigation", async () => {
    const router = mount();
    expect(screen.getByLabelText("Query values")).toHaveTextContent("start:2");
    fireEvent.click(screen.getByRole("button", { name: "Push query" }));
    await waitFor(() => expect(screen.getByLabelText("Query values")).toHaveTextContent("next:2"));
    expect(router.state.historyAction).toBe("PUSH");
    expect(new URLSearchParams(router.state.location.search).getAll("tag")).toEqual(["a", "b"]);
    await act(() => router.navigate(-1));
    expect(screen.getByLabelText("Query values")).toHaveTextContent("start:2");
    await act(() => router.navigate(1));
    expect(screen.getByLabelText("Query values")).toHaveTextContent("next:2");
  });

  it("supports explicit replace and a single atomic updater navigation", async () => {
    const router = mount();
    fireEvent.click(screen.getByRole("button", { name: "Replace query" }));
    await waitFor(() => expect(router.state.historyAction).toBe("REPLACE"));
    const navigate = vi.spyOn(router, "navigate");
    fireEvent.click(screen.getByRole("button", { name: "Batch update" }));
    await waitFor(() => expect(screen.getByLabelText("Query values")).toHaveTextContent("replacement!:3"));
    expect(navigate).toHaveBeenCalledTimes(1);
    await act(() => router.navigate(-1));
    expect(screen.getByLabelText("Query values")).toHaveTextContent("replacement:2");
  });

  it("does not rewrite malformed URLs on read and omits defaults on reset", async () => {
    const router = mount(["/dev-guide/frontend/patterns?page=bad&q=first&q=second&tag=a&tag=b"]);
    expect(screen.getByLabelText("Query values")).toHaveTextContent("first:1");
    expect(router.state.location.search).toContain("page=bad");
    fireEvent.click(screen.getByRole("button", { name: "Reset query" }));
    await waitFor(() => expect(router.state.location.search).toBe("?tag=a&tag=b"));
  });

  it("rejects invalid writes before navigation", () => {
    let query: ReturnType<typeof useAppQueryParams<typeof schema>> | undefined;
    function Capture() {
      const current = useAppQueryParams(schema);
      useEffect(() => {
        query = current;
      }, [current]);
      return null;
    }
    const router = createMemoryRouter([{ path: "/", Component: Capture }]);
    render(<RouterProvider router={router} />);
    const navigate = vi.spyOn(router, "navigate");
    expect(() => query?.setValues({ q: "changed", page: 0 })).toThrow();
    expect(navigate).not.toHaveBeenCalled();
    expect(router.state.location.search).toBe("");
  });

  it("keeps methods stable on unrelated renders and refreshes values after navigation", async () => {
    let captured: ReturnType<typeof useAppQueryParams<typeof schema>> | undefined;
    function Capture() {
      const [, setCount] = useState(0);
      const current = useAppQueryParams(schema);
      useEffect(() => {
        captured = current;
      }, [current]);
      return <button onClick={() => setCount(count => count + 1)}>Rerender</button>;
    }
    const router = createMemoryRouter([{ path: "/", Component: Capture }]);
    render(<RouterProvider router={router} />);
    const initial = captured;
    fireEvent.click(screen.getByRole("button", { name: "Rerender" }));
    expect(captured).toBe(initial);
    await act(() => router.navigate("/?q=changed"));
    expect(captured?.get("q")).toBe("changed");
    expect(captured?.set).not.toBe(initial?.set);
  });

  it("exposes schema-derived key and value types", () => {
    type Query = ReturnType<typeof useAppQueryParams<typeof schema>>;
    expectTypeOf<Query["values"]>().toEqualTypeOf<{ q: string; page: number }>();
    // Compile-only assertions: this function deliberately never executes hooks.
    const assertTypes = (query: Query) => {
      expectTypeOf(query.get("page")).toEqualTypeOf<number>();
      query.set("page", 2);
      // @ts-expect-error Keys are constrained to the schema.
      query.get("unknown");
      // @ts-expect-error Numeric output requires a number, not its URL encoding.
      query.set("page", "2");
      // @ts-expect-error Batch values use the same output types.
      query.setValues({ page: "2" });
    };
    expect(assertTypes).toBeTypeOf("function");
  });
});
