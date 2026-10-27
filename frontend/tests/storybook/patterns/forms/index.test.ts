import { describe, expect, it } from "vitest";
import * as stories from "../../../../docs/storybook/patterns/Forms/Forms.stories";

describe("Forms pattern Storybook registration", () => {
  it("retains all six interactive panels outside the application route registry", () => {
    expect(stories.default.title).toBe("Development Guide/Patterns/Forms");
    expect(
      Object.keys(stories)
        .filter(name => name !== "default")
        .sort(),
    ).toEqual([
      "AsyncLookups",
      "AsyncSubmissionAndServerErrors",
      "DependentFields",
      "DirtyStateAndNavigationGuard",
      "RepeatedAndNestedFields",
      "ValidationAndErrorPresentation",
    ]);
  });
});
