import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  BooleanPreferenceControl,
  CornerRoundnessControl,
  DesktopTableSizeControl,
  DrawerModeControl,
  EditorPresentationControl,
  FontSizeControl,
  HeaderStickinessControl,
  LocaleControl,
  ThemePreferenceControl,
} from "@/features/settings/sections/interface/components/InterfaceSettingsControls";
import { themeSetup } from "@/app/theme/themeSetup";
import { settingsChoiceToggleGroupSx } from "@/features/settings/components/settingsChoiceToggleGroupSx";

describe("settingsChoiceToggleGroupSx", () => {
  it("uses color-scheme-aware semantic text and hover colors", () => {
    const button = settingsChoiceToggleGroupSx["& .MuiToggleButton-root"];

    expect(button.color).toBe("text.secondary");
    expect(button["&:hover"]).toMatchObject({
      bgcolor: "action.hover",
      color: "text.primary",
    });
    expect(button["&.Mui-selected"]).toMatchObject({
      bgcolor: "action.selected",
      color: "text.primary",
    });
  });
});

describe("HeaderStickinessControl", () => {
  it("offers all three scroll modes and ignores an attempt to deselect the current mode", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <HeaderStickinessControl
        bothRowsLabel="Both rows"
        firstRowLabel="First row"
        label="Header while scrolling"
        noneLabel="No sticky rows"
        onChange={onChange}
        value="first-row"
      />,
    );

    const group = screen.getByRole("group", { name: "Header while scrolling" });
    expect(group).toBeVisible();
    expect(screen.getByRole("button", { name: "First row" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Both rows" })).toBeVisible();
    expect(screen.getByRole("button", { name: "No sticky rows" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "First row" }));
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Both rows" }));
    expect(onChange).toHaveBeenCalledWith("both-rows");
  });
});

describe("BooleanPreferenceControl", () => {
  it("passes actual boolean values and keeps the selected choice", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <BooleanPreferenceControl checked label="Contrast" noLabel="No" onChange={onChange} yesLabel="Yes" />,
    );
    await user.click(screen.getByRole("button", { name: "No" }));
    expect(onChange).toHaveBeenLastCalledWith(false);
    rerender(
      <BooleanPreferenceControl checked={false} label="Contrast" noLabel="No" onChange={onChange} yesLabel="Yes" />,
    );
    await user.click(screen.getByRole("button", { name: "No" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(onChange).toHaveBeenLastCalledWith(true);
  });
});

describe("LocaleControl", () => {
  it("uses translated presentation labels and decorative flags for the current two locales", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LocaleControl label="Language" onChange={onChange} value="en" />);
    expect(screen.getByRole("group", { name: "Language" })).toBeVisible();
    expect(screen.getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "HR" }));
    expect(onChange).toHaveBeenCalledWith("hr");
  });
});

describe("interface choice adapters", () => {
  it.each([
    [
      "drawer",
      (onChange: (value: string) => void) => (
        <DrawerModeControl
          label="Choice"
          onChange={onChange}
          permanentLabel="Permanent"
          temporaryLabel="Temporary"
          value="temporary"
        />
      ),
      "Permanent",
      "permanent",
    ],
    [
      "editor",
      (onChange: (value: string) => void) => (
        <EditorPresentationControl
          dialogLabel="Dialog"
          dockedPanelLabel="Docked"
          label="Choice"
          onChange={onChange}
          overlayPanelLabel="Overlay"
          value="docked-panel"
        />
      ),
      "Dialog",
      "dialog",
    ],
    [
      "table size",
      (onChange: (value: string) => void) => (
        <DesktopTableSizeControl
          label="Choice"
          mediumLabel="Medium"
          onChange={onChange}
          smallLabel="Small"
          value="small"
        />
      ),
      "Medium",
      "medium",
    ],
    [
      "theme",
      (onChange: (value: string) => void) => (
        <ThemePreferenceControl
          darkLabel="Dark"
          label="Choice"
          lightLabel="Light"
          onChange={onChange}
          softDarkLabel="Soft dark"
          systemLabel="System"
          value="system"
        />
      ),
      "Soft dark",
      "soft-dark",
    ],
    [
      "font size",
      (onChange: (value: string) => void) => (
        <FontSizeControl
          bigLabel="Big"
          label="Choice"
          mediumLabel="Medium"
          normalLabel="Normal"
          onChange={onChange}
          value="normal"
        />
      ),
      "Big",
      "big",
    ],
  ] as const)("keeps the %s adapter's label and value contract", async (_name, createControl, nextLabel, nextValue) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(createControl(onChange));
    expect(screen.getByRole("group", { name: "Choice" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: nextLabel }));
    expect(onChange).toHaveBeenCalledWith(nextValue);
  });

  it("retains the configured numeric roundness range", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { min, max } = themeSetup.shape.surfaceBorderRadiusRange;
    render(<CornerRoundnessControl label="Corner roundness" onChange={onChange} value={max} />);
    expect(screen.getByRole("button", { name: `${max}px` })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: `${min}px` }));
    expect(onChange).toHaveBeenCalledWith(min);
  });
});
