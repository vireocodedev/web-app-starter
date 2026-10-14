import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UrlBackedFiltersPanel } from "@/features/development-guide/patterns/tablesAndCollections/components/UrlBackedFiltersPanel/UrlBackedFiltersPanel";

const exampleSelection = vi.hoisted(() => ({ index: 0 }));

vi.mock("@/features/development-guide/patterns/gallery", () => ({
  ExampleGallery: ({ resources }: { resources: { examples: { preview: React.ReactNode }[] } }) =>
    resources.examples[exampleSelection.index]?.preview,
}));

vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({ t: (key: string) => key }),
}));

describe("UrlBackedFiltersPanel", () => {
  beforeEach(() => {
    exampleSelection.index = 0;
  });

  it("filters the collection from the URL-owned search field", () => {
    render(
      <MemoryRouter>
        <UrlBackedFiltersPanel />
      </MemoryRouter>,
    );

    const queryInput = screen.getByRole("textbox", {
      name: "tablesExamples.url.filters.query",
    });
    queryInput.focus();
    fireEvent.change(queryInput, { target: { value: "Atlas " } });
    expect(queryInput).toHaveFocus();
    expect(queryInput).toHaveValue("Atlas ");
    fireEvent.change(queryInput, { target: { value: "Atlas migration" } });

    expect(queryInput).toHaveFocus();
    expect(queryInput).toHaveValue("Atlas migration");
    expect(screen.getByText("Atlas migration")).toBeVisible();
    expect(screen.queryByText("Beacon rollout")).not.toBeInTheDocument();
  });

  it("corrects an out-of-range page while preserving unrelated repeated query parameters", async () => {
    exampleSelection.index = 1;

    function LocationSearch() {
      return <output data-testid="location-search">{useLocation().search}</output>;
    }

    render(
      <MemoryRouter initialEntries={["/?tag=one&tag=two&page=999&view=summary"]}>
        <UrlBackedFiltersPanel />
        <LocationSearch />
      </MemoryRouter>,
    );

    expect(screen.getByText("Ember retrofit")).toBeVisible();
    expect(screen.getByText("Fjord survey")).toBeVisible();
    await waitFor(() => {
      const params = new URLSearchParams(screen.getByTestId("location-search").textContent ?? "");
      expect(params.get("page")).toBe("3");
      expect(params.getAll("tag")).toEqual(["one", "two"]);
      expect(params.get("view")).toBe("summary");
    });
  });
});
