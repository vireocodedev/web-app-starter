import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LineItemsPreview } from "../../../../../../docs/storybook/patterns/Forms/components/RepeatedAndNestedFieldsPanel/LineItemsPreview";

vi.mock("../../../../../../docs/storybook/examples/shared/localization/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) => [key, ...Object.values(values ?? {})].join(" "),
  }),
}));

vi.mock("@/app/localization/hooks/useAppLocalizationFormatters", () => ({
  useAppLocalizationFormatters: () => ({
    formatCurrency: (value: number) => `EUR ${value.toFixed(2)}`,
  }),
}));

const key = "formsExamples.repeated";
const row = (number: number) => screen.getByRole("group", { name: `${key}.row ${number}` });
const field = (number: number, name: string) =>
  within(row(number)).getByRole("textbox", {
    name: new RegExp(`${key}.fields.${name}`),
  });
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name: `${key}.${name}` }));

describe("LineItemsPreview", () => {
  it("keeps row identity, values and nested errors with the remaining row after removal", async () => {
    render(<LineItemsPreview />);
    click("add");
    click("add");
    fireEvent.change(field(2, "description"), { target: { value: "Second" } });
    fireEvent.change(field(2, "quantity"), { target: { value: "0" } });
    fireEvent.change(field(3, "description"), { target: { value: "Third" } });
    const secondDescription = field(2, "description");
    click("submit");
    expect(await within(row(2)).findByText(`${key}.errors.quantityInvalid`)).toBeVisible();

    click("removeRow 1");

    await waitFor(() => {
      expect(field(1, "description")).toBe(secondDescription);
      expect(field(1, "description")).toHaveValue("Second");
      expect(field(1, "quantity")).toHaveValue("0");
      expect(field(1, "quantity")).toHaveAttribute("aria-invalid", "true");
      expect(field(2, "description")).toHaveValue("Third");
      expect(field(2, "quantity")).not.toHaveAttribute("aria-invalid", "true");
    });

    click("removeRow 1");
    await waitFor(() => {
      expect(field(1, "description")).toHaveValue("Third");
      expect(screen.queryByText(`${key}.errors.quantityInvalid`)).not.toBeInTheDocument();
    });
  });

  it("parses nested values, shows the accepted result and resets edits to the new baseline", async () => {
    render(<LineItemsPreview />);
    fireEvent.change(field(1, "description"), {
      target: { value: "  Accepted item  " },
    });
    fireEvent.change(field(1, "quantity"), { target: { value: "3" } });
    fireEvent.change(field(1, "unitPrice"), { target: { value: "12.5" } });
    expect(screen.getByText(`${key}.total EUR 37.50`)).toBeVisible();
    click("submit");
    expect(await screen.findByText(`${key}.accepted`)).toBeVisible();
    expect(screen.getByText(`${key}.acceptedItem Accepted item 3 EUR 12.50`)).toBeVisible();
    expect(field(1, "description")).toHaveValue("Accepted item");

    fireEvent.change(field(1, "description"), { target: { value: "Unsaved" } });
    click("add");
    click("reset");

    expect(screen.getAllByRole("group")).toHaveLength(1);
    expect(field(1, "description")).toHaveValue("Accepted item");
    expect(field(1, "quantity")).toHaveValue("3");
    expect(field(1, "unitPrice")).toHaveValue("12.5");
  });

  it("explains an empty list, blocks acceptance and permits adding a valid replacement", async () => {
    render(<LineItemsPreview />);
    click("removeRow 1");
    expect(await screen.findByText(`${key}.errors.itemRequired`)).toBeVisible();
    click("submit");
    await waitFor(() => expect(screen.queryByText(`${key}.accepted`)).not.toBeInTheDocument());

    click("add");
    fireEvent.change(field(1, "description"), {
      target: { value: "Replacement" },
    });
    await waitFor(() => expect(screen.getByRole("button", { name: `${key}.submit` })).toBeEnabled());
    click("submit");
    expect(await screen.findByText(`${key}.acceptedItem Replacement 1 EUR 10.00`)).toBeVisible();
  });

  it("resets unsaved rows to the original baseline before the first acceptance", () => {
    render(<LineItemsPreview />);
    click("add");
    fireEvent.change(field(1, "description"), { target: { value: "Unsaved" } });
    click("reset");
    expect(screen.getAllByRole("group")).toHaveLength(1);
    expect(field(1, "description")).toHaveValue(`${key}.defaultItem`);
  });
});
