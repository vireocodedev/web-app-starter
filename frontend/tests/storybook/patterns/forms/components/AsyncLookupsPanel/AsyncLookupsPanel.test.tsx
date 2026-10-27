import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchLookupPreview } from "../../../../../../docs/storybook/patterns/Forms/components/AsyncLookupsPanel/SearchLookupPreview";
import { DependentLookupPreview } from "../../../../../../docs/storybook/patterns/Forms/components/AsyncLookupsPanel/DependentLookupPreview";
import { renderApp } from "../../../../../renderApp";

vi.mock("../../../../../../docs/storybook/examples/shared/localization/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({
    t: (key: string, values?: { name?: string; id?: string }) =>
      values?.name ? `${key}:${values.name}` : values?.id ? `${key}:${values.id}` : key,
  }),
}));

const key = (value: string) => `formsExamples.asyncLookups.${value}`;

async function selectAda(label: string) {
  const input = screen.getByRole("combobox", { name: key(label) });
  fireEvent.change(input, { target: { value: "Ada" } });
  fireEvent.click(await screen.findByRole("option", { name: "Ada Lovelace" }, { timeout: 2000 }));
  return input;
}

describe("async form lookups", () => {
  it("shows loading and empty results while preserving a selection omitted by the new search", async () => {
    renderApp(<SearchLookupPreview />);
    expect(screen.getByRole("status")).toHaveTextContent(key("loading"));
    const input = await selectAda("person");
    fireEvent.change(input, { target: { value: "zzz" } });
    await waitFor(() => expect(screen.getByText(key("empty"), { selector: '[role="status"]' })).toBeVisible(), {
      timeout: 2000,
    });
    expect(screen.getByText(`${key("selection")}:Ada Lovelace`)).toBeVisible();
  });

  it("exposes a deterministic failure and recovers on retry", async () => {
    renderApp(<SearchLookupPreview failFirst />);
    expect(await screen.findByText(key("failed"), {}, { timeout: 2000 })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: key("retry") }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(key("results")), { timeout: 2000 });
    expect(screen.queryByText(key("failed"))).not.toBeInTheDocument();
  });

  it("retains same-department selection but clears it synchronously when the department changes", async () => {
    renderApp(<DependentLookupPreview />);
    const input = await selectAda("assignee");
    fireEvent.change(input, { target: { value: "Grace" } });
    fireEvent.click(screen.getByRole("button", { name: key("submit") }));
    expect(await screen.findByText(`${key("accepted")}:ada`)).toBeVisible();
    fireEvent.mouseDown(screen.getByRole("combobox", { name: key("department") }));
    fireEvent.click(
      screen.getByRole("option", {
        name: "formsExamples.dependent.departments.operations",
      }),
    );
    expect(screen.getByText(`${key("selection")}:${key("none")}`)).toBeVisible();
    expect(screen.queryByText(`${key("accepted")}:ada`)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: key("submit") }));
    expect(await screen.findByText(key("invalidAssignee"))).toBeVisible();
    fireEvent.change(input, { target: { value: "Lin" } });
    fireEvent.click(await screen.findByRole("option", { name: "Lin Lanying" }, { timeout: 2000 }));
    fireEvent.click(screen.getByRole("button", { name: key("submit") }));
    expect(await screen.findByText(`${key("accepted")}:lin`)).toBeVisible();
  });
});
