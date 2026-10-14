import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { appLocales } from "@/app/localization/localeConfig";

import { AppLocaleSelector } from "@/app/shell/components/AppLocaleSelector";

describe("AppLocaleSelector", () => {
  it("renders every registered locale code and emits the selected locale", async () => {
    const user = userEvent.setup();
    const onLocaleChange = vi.fn();

    render(<AppLocaleSelector ariaLabel="Choose language" locale="en" onLocaleChange={onLocaleChange} />);

    const selector = screen.getByRole("button", { name: "Choose language EN" });

    expect(selector).toHaveTextContent("EN");

    await user.hover(selector);
    expect(await screen.findByRole("tooltip", { name: "Choose language" })).toBeVisible();
    await user.unhover(selector);

    await user.click(selector);

    for (const locale of appLocales) {
      expect(screen.getByRole("menuitem", { name: locale.toUpperCase() })).toBeVisible();
    }

    expect(screen.getByRole("menuitem", { name: "EN" })).toHaveFocus();
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onLocaleChange).toHaveBeenCalledWith("hr");
  });
});
