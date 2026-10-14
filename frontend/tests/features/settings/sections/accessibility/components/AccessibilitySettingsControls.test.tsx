import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  LinkUnderlinePreferenceControl,
  MotionPreferenceControl,
} from "@/features/settings/sections/accessibility/components/AccessibilitySettingsControls";

describe("accessibility choice adapters", () => {
  it("keeps motion selected and passes the reduced-motion value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MotionPreferenceControl
        label="Motion"
        onChange={onChange}
        reduceLabel="Reduce"
        systemLabel="System"
        value="system"
      />,
    );
    await user.click(screen.getByRole("button", { name: "System" }));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Reduce" }));
    expect(onChange).toHaveBeenCalledWith("reduce");
  });

  it("keeps underline selected and passes the always-underline value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <LinkUnderlinePreferenceControl
        alwaysLabel="Always"
        label="Underlines"
        onChange={onChange}
        pageLabel="Page"
        value="page"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Page" }));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Always" }));
    expect(onChange).toHaveBeenCalledWith("always");
  });
});
