import { describe, expect, it } from "vitest";

import { appExampleNavigationGroups, appRouteRegistry } from "@/app/router/routeRegistry";

describe("Forms pattern routes", () => {
  it("registers six development child routes in one expanded group", () => {
    const formsGroup = appExampleNavigationGroups.find(group => group.id === "forms");

    expect(formsGroup).toMatchObject({ defaultExpanded: true });
    expect(formsGroup?.items).toHaveLength(6);
    expect(formsGroup?.items.map(({ labelKey }) => labelKey).slice(-3)).toEqual([
      "navigation.formsDependentFields",
      "navigation.formsAsyncLookups",
      "navigation.formsRepeatedAndNestedFields",
    ]);
    expect(appRouteRegistry.formsValidationAndErrorPresentation).toMatchObject({
      groupId: "forms",
      parentId: "examples",
      scrollToTop: true,
    });
  });
});
