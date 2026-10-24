import { describe, expect, it } from "vitest";

import { appExampleNavigationGroups, appRouteRegistry } from "@/app/router/routeRegistry";

describe("Tables and collections pattern routes", () => {
  it("registers four development child routes in an expanded group", () => {
    const tablesGroup = appExampleNavigationGroups.find(group => group.id === "tablesAndCollections");

    expect(tablesGroup).toMatchObject({ defaultExpanded: true });
    expect(tablesGroup?.items).toHaveLength(4);
    expect(appRouteRegistry.tablesUrlBackedFilters).toMatchObject({
      groupId: "tablesAndCollections",
      parentId: "patternTablesAndCollections",
      scrollToTop: true,
    });
  });
});
