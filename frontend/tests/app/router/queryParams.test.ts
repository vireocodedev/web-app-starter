import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseQueryParams, updateQueryParams } from "@/app/router/queryParams";

const pageCodec = z.codec(z.string().regex(/^\d+$/), z.number().int().positive(), { decode: Number, encode: String });
const querySchema = z.object({
  q: z.string().default(""),
  page: pageCodec.default(1),
  status: z.enum(["all", "active"]).default("all"),
  enabled: z
    .codec(z.enum(["true", "false"]), z.boolean(), {
      decode: value => value === "true",
      encode: value => (value ? "true" : "false"),
    })
    .default(false),
  optional: z.string().optional(),
});

describe("query parameter schema engine", () => {
  it("uses defaults independently and reads the first duplicate scalar", () => {
    expect(parseQueryParams(querySchema, "q=first&q=second&page=0&status=other&enabled=true")).toEqual({
      q: "first",
      page: 1,
      status: "all",
      enabled: true,
      optional: undefined,
    });
    expect(parseQueryParams(querySchema, "")).toEqual({
      q: "",
      page: 1,
      status: "all",
      enabled: false,
      optional: undefined,
    });
  });

  it("encodes typed values and preserves unrelated repeated parameters", () => {
    const original = new URLSearchParams("tag=a&tag=b&q=old&q=duplicate&page=2");
    const next = updateQueryParams(querySchema, original, {
      q: "A & B",
      enabled: true,
    });

    expect(next.getAll("tag")).toEqual(["a", "b"]);
    expect(next.getAll("q")).toEqual(["A & B"]);
    expect(next.get("page")).toBe("2");
    expect(next.get("enabled")).toBe("true");
    expect(original.getAll("q")).toEqual(["old", "duplicate"]);
    expect(parseQueryParams(querySchema, next).q).toBe("A & B");
  });

  it("omits defaults and optional undefined, and applies a typed updater together", () => {
    const next = updateQueryParams(querySchema, "page=3&q=term&enabled=true&optional=x&tag=a&tag=b", values => ({
      page: values.page + 1,
      q: "",
      enabled: false,
      optional: undefined,
    }));
    expect(next.toString()).toBe("tag=a&tag=b&page=4");
  });

  it("rejects invalid runtime values and unknown keys without changing input", () => {
    const original = new URLSearchParams("q=old&page=2");
    expect(() => updateQueryParams(querySchema, original, { q: "new", page: 0 })).toThrow();
    expect(() => updateQueryParams(querySchema, original, { page: "3" } as never)).toThrow();
    expect(() => updateQueryParams(querySchema, original, { unknown: "x" } as never)).toThrow(
      "Unknown query parameter",
    );
    expect(original.toString()).toBe("q=old&page=2");
    expect(() => updateQueryParams(querySchema, original, (() => Promise.resolve({ q: "x" })) as never)).toThrow(
      "synchronous objects",
    );
  });

  it("requires defaults and reversible string encodings instead of arbitrary coercion", () => {
    expect(() => parseQueryParams(z.object({ q: z.string() }), "")).toThrow();
    expect(() => parseQueryParams(z.object({ page: z.coerce.number().default(1) }), "")).toThrow("encode to strings");
    expect(() =>
      parseQueryParams(
        z.object({
          q: z
            .string()
            .transform(value => value.length)
            .default(0),
        }),
        "",
      ),
    ).toThrow();
    expect(() => parseQueryParams(z.object({ object: z.object({}).default({}) }), "")).toThrow("scalar values");
  });

  it("uses complete valid defaults when an object refinement rejects the field combination", () => {
    const range = z
      .object({
        from: pageCodec.default(1),
        to: pageCodec.default(2),
      })
      .refine(values => values.from <= values.to);

    expect(parseQueryParams(range, "from=3&to=2")).toEqual({ from: 1, to: 2 });
    expect(parseQueryParams(range, "from=bad&to=4")).toEqual({ from: 1, to: 4 });
    expect(() => updateQueryParams(range, "", { from: 5 })).toThrow();

    const original = new URLSearchParams("from=8&to=2&tag=a&tag=b");
    const next = updateQueryParams(range, original, { to: 4 });
    expect(next.has("from")).toBe(false);
    expect(next.get("to")).toBe("4");
    expect(next.getAll("tag")).toEqual(["a", "b"]);
    expect(parseQueryParams(range, next)).toEqual({ from: 1, to: 4 });
    expect(original.get("from")).toBe("8");
  });

  it("canonicalizes every schema field when writing a partial update", () => {
    const next = updateQueryParams(querySchema, "q=first&q=second&page=bad&status=all&tag=a&tag=b", { enabled: true });
    expect(next.getAll("q")).toEqual(["first"]);
    expect(next.has("page")).toBe(false);
    expect(next.has("status")).toBe(false);
    expect(next.get("enabled")).toBe("true");
    expect(next.getAll("tag")).toEqual(["a", "b"]);
  });
});
