import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LocaleControl } from "@/features/settings/sections/interface/components/InterfaceSettingsControls";

vi.mock("@/app/localization/localeConfig", () => ({ appLocales: ["en", "hr", "de", "fr"] }));
vi.mock("@/app/localization/appLocalePresentation", () => ({
  appLocalePresentation: {
    en: { countryCode: "GB", shortLabel: "EN" },
    hr: { countryCode: "HR", shortLabel: "HR" },
    de: { countryCode: "DE", shortLabel: "DE" },
    fr: { countryCode: "FR", shortLabel: "FR" },
  },
}));

describe("LocaleControl dropdown fallback", () => {
  it("switches to a named select when four or more locales are configured", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LocaleControl label="Language" onChange={onChange} value="en" />);
    expect(screen.queryByRole("group", { name: "Language" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "Language" }));
    await user.click(screen.getByRole("option", { name: "HR" }));
    expect(onChange).toHaveBeenCalledWith("hr");
  });
});
