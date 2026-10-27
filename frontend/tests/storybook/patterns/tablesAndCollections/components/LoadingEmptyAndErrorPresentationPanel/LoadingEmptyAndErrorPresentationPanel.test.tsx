import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LoadingEmptyAndErrorPresentationPanel } from "../../../../../../docs/storybook/patterns/TablesAndCollections/components/LoadingEmptyAndErrorPresentationPanel/LoadingEmptyAndErrorPresentationPanel";

vi.mock("../../../../../../docs/storybook/patterns/shared/gallery", () => ({
  ExampleGallery: ({ resources }: { resources: { examples: { preview: React.ReactNode }[] } }) => (
    <>
      {resources.examples.map(({ preview }, index) => (
        <section key={index} aria-label={`Example ${index}`}>
          {preview}
        </section>
      ))}
    </>
  ),
}));

vi.mock("../../../../../../docs/storybook/examples/shared/localization/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({ t: (key: string) => key }),
}));

describe("LoadingEmptyAndErrorPresentationPanel", () => {
  it("creates the first example record from the centered empty action", () => {
    render(<LoadingEmptyAndErrorPresentationPanel />);
    const empty = within(screen.getByRole("region", { name: "Example 2" }));
    expect(empty.getByText("tablesExamples.states.empty.message")).toBeVisible();
    fireEvent.click(empty.getByRole("button", { name: "tablesExamples.states.empty.create" }));
    expect(empty.getByText("Atlas migration")).toBeVisible();
    expect(empty.queryByRole("button")).not.toBeInTheDocument();
  });

  it("retains prior rows while exposing and recovering a refresh error", () => {
    render(<LoadingEmptyAndErrorPresentationPanel />);
    const preview = within(screen.getByRole("region", { name: "Example 3" }));

    expect(preview.getByText("Atlas migration")).toBeVisible();
    expect(preview.getByText("tablesExamples.states.error.message")).toBeVisible();

    fireEvent.click(
      preview.getByRole("button", {
        name: "tablesExamples.states.error.retry",
      }),
    );

    expect(preview.queryByText("tablesExamples.states.error.message")).not.toBeInTheDocument();
    expect(preview.getByText("Atlas migration")).toBeVisible();
  });
});
