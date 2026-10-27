import { describe, expect, it } from "vitest";
import * as stories from "../../../../docs/storybook/patterns/TablesAndCollections/TablesAndCollections.stories";

describe("Tables and collections Storybook registration", () => {
  it("retains all four interactive panels outside the application route registry", () => {
    expect(stories.default.title).toBe("Development Guide/Patterns/Tables And Collections");
    expect(
      Object.keys(stories)
        .filter(name => name !== "default")
        .sort(),
    ).toEqual([
      "LoadingEmptyAndErrorPresentation",
      "RowSelectionAndBulkActions",
      "SortingAndPagination",
      "UrlBackedFilters",
    ]);
  });
});
