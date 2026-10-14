import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RowSelectionAndBulkActionsPanel } from "@/features/development-guide/patterns/tablesAndCollections/components/RowSelectionAndBulkActionsPanel/RowSelectionAndBulkActionsPanel";

vi.mock("@/features/development-guide/patterns/gallery", () => ({
  ExampleGallery: ({ resources }: { resources: { examples: { preview: React.ReactNode }[] } }) =>
    resources.examples[1]?.preview,
}));

vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({ t: (key: string) => key }),
}));

describe("RowSelectionAndBulkActionsPanel", () => {
  it("selects all visible rows and exposes partial selection", () => {
    render(<RowSelectionAndBulkActionsPanel />);

    const selectAll = screen.getByRole("checkbox", {
      name: "tablesExamples.selection.multi.selectAll",
    });
    fireEvent.click(selectAll);

    expect(selectAll).toBeChecked();
    const atlas = screen.getAllByRole("checkbox", {
      name: "tablesExamples.selection.multi.select",
    })[0];
    if (!atlas) throw new Error("Expected the first row selection control");
    fireEvent.click(atlas);

    expect(selectAll).not.toBeChecked();
    expect(selectAll).toHaveAttribute("data-indeterminate", "true");
  });
});
