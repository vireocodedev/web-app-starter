import { describe, expect, it } from "vitest";

import {
  defaultTableUrlState,
  parseTableUrlState,
  resolveTableUrlPage,
  serializeTableUrlState,
  withTableFilters,
} from "../../../../../docs/storybook/patterns/TablesAndCollections/models/TableUrlState";

describe("TableUrlState", () => {
  it("parses allowlisted values and converts URL pages to zero-based state", () => {
    const result = parseTableUrlState(
      new URLSearchParams("query=atlas&status=active&page=3&size=4&sort=name&direction=desc"),
    );

    expect(result).toEqual({
      filters: { query: "atlas", status: "active" },
      table: {
        page: 2,
        rowsPerPage: 4,
        sort: { columnId: "name", direction: "desc" },
      },
    });
  });

  it("falls back safely for malformed and unapproved values", () => {
    expect(
      parseTableUrlState(new URLSearchParams("status=deleted&page=-2&size=500&sort=internal&direction=sideways")),
    ).toEqual(defaultTableUrlState);
  });

  it.each(["sort=name", "direction=desc", "sort=name&direction=sideways"])(
    "requires a valid paired sort for %s",
    search => {
      expect(parseTableUrlState(new URLSearchParams(search)).table.sort).toBeNull();
    },
  );

  it("preserves unrelated repeated parameters when serializing resolved table state", () => {
    const original = new URLSearchParams("page=999&tag=one&tag=two&view=summary");
    const resolved = resolveTableUrlPage(parseTableUrlState(original), 6);
    const result = serializeTableUrlState(resolved, original);

    expect(result.get("page")).toBe("3");
    expect(result.getAll("tag")).toEqual(["one", "two"]);
    expect(result.get("view")).toBe("summary");
    expect(original.get("page")).toBe("999");
  });

  it("preserves query whitespace while typing and resets the page when filters change", () => {
    const filtered = withTableFilters(
      {
        ...defaultTableUrlState,
        table: { ...defaultTableUrlState.table, page: 4 },
      },
      { query: " beacon ", status: "review" },
    );

    expect(filtered.table.page).toBe(0);
    expect(serializeTableUrlState(filtered).toString()).toBe("query=+beacon+&status=review");
  });

  it("resolves an out-of-range server page after the total becomes known", () => {
    const parsed = parseTableUrlState(new URLSearchParams("page=999&size=2"));
    const resolved = resolveTableUrlPage(parsed, 6);

    expect(resolved.table.page).toBe(2);
    expect(serializeTableUrlState(resolved).toString()).toBe("page=3");
  });
});
