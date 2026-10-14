import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SortingAndPaginationPanel } from "@/features/development-guide/patterns/tablesAndCollections/components/SortingAndPaginationPanel/SortingAndPaginationPanel";

vi.mock("@/features/development-guide/patterns/gallery", () => ({
  ExampleGallery: ({ resources }: { resources: { examples: { preview: React.ReactNode }[] } }) =>
    resources.examples[1]?.preview,
}));

vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
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
