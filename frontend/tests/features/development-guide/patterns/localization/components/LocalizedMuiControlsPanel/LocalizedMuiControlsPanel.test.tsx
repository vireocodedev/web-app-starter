import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocalizedMuiControlsPanel } from "@/features/development-guide/patterns/localization";

vi.mock("@/app/localization/hooks/useAppLocalization", () => ({
  useAppLocalization: () => ({ locale: "en" }),
}));
vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/features/development-guide/patterns/gallery/components/ExampleCodeBlock", () => ({
  ExampleCodeBlock: () => null,
}));

afterEach(() => vi.unstubAllGlobals());

describe("LocalizedMuiControlsPanel", () => {
  it("keeps pagination state when opening source and reloads only the selected preview", async () => {
    vi.stubGlobal("location", new URL("http://localhost:5173"));
    vi.stubGlobal("__RGO_EXAMPLE_SOURCE__", {
      editorEndpoint: "/__rgo_example_source",
      repositoryBaseUrl: null,
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    render(<LocalizedMuiControlsPanel />);
    const tableSection = screen
      .getByRole("heading", {
        name: "localizationExamples.mui.table.title",
      })
      .closest("section")!;
    const paginationSection = screen
      .getByRole("heading", {
        name: "localizationExamples.mui.pagination.title",
      })
      .closest("section")!;
    const table = within(tableSection);
    const pagination = within(paginationSection);

    fireEvent.click(table.getByRole("button", { name: "Go to next page" }));
    fireEvent.click(pagination.getByRole("button", { name: "Go to next page" }));
    expect(table.getByText("11–20 of 42")).toBeVisible();
    expect(pagination.getByRole("button", { name: "page 2" })).toHaveAttribute("aria-current", "page");

    const source = table.getByRole("button", {
      name: "exampleGallery.source.openEditor",
    });
    fireEvent.click(source);
    await waitFor(() => expect(source).toBeEnabled());
    expect(fetchMock).toHaveBeenCalledWith("/__rgo_example_source", {
      body: JSON.stringify({
        path: "src/features/development-guide/patterns/localization/components/LocalizedMuiControlsPanel/TablePaginationPreview.tsx",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    expect(table.getByText("11–20 of 42")).toBeVisible();
    expect(pagination.getByRole("button", { name: "page 2" })).toHaveAttribute("aria-current", "page");

    fireEvent.click(table.getByRole("button", { name: "exampleGallery.reload" }));
    expect(table.getByText("1–10 of 42")).toBeVisible();
    expect(pagination.getByRole("button", { name: "page 2" })).toHaveAttribute("aria-current", "page");

    fireEvent.click(table.getByRole("button", { name: "Go to next page" }));
    fireEvent.click(pagination.getByRole("button", { name: "exampleGallery.reload" }));
    expect(table.getByText("11–20 of 42")).toBeVisible();
    expect(pagination.getByRole("button", { name: "page 1" })).toHaveAttribute("aria-current", "page");
  });
});
