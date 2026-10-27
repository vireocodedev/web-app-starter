import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SortingAndPaginationPanel } from "../../../../../../docs/storybook/patterns/TablesAndCollections/components/SortingAndPaginationPanel/SortingAndPaginationPanel";

vi.mock("../../../../../../docs/storybook/patterns/shared/gallery", () => ({
  ExampleGallery: ({ resources }: { resources: { examples: { preview: React.ReactNode }[] } }) =>
    resources.examples[1]?.preview,
}));

vi.mock("../../../../../../docs/storybook/examples/shared/localization/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({ t: (key: string) => key }),
}));

describe("SortingAndPaginationPanel", () => {
  it("paginates a bounded local collection", () => {
    render(<SortingAndPaginationPanel />);

    expect(screen.getByText("Atlas migration")).toBeVisible();
    expect(screen.queryByText("Canal inspection")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "tablesExamples.shared.pagination.next",
      }),
    );

    expect(screen.getByText("Canal inspection")).toBeVisible();
    expect(screen.queryByText("Atlas migration")).not.toBeInTheDocument();
  });
});
