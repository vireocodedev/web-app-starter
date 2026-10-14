import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { AppLocalizationProvider } from "@/app/localization/components/AppLocalizationProvider";
import { useAppLocalization } from "@/app/localization/hooks/useAppLocalization";
import { appLocalStorage, appLocalStorageKeys } from "@/app/data/storage/appLocalStorage";
import { resolveInitialLocale } from "@/app/localization/preferences/localePreference";

function LocaleControls() {
  const { locale, setLocale } = useAppLocalization();

  return (
    <>
      <output>{locale}</output>
      <button onClick={() => setLocale("hr")} type="button">
        Croatian
      </button>
      <button onClick={() => setLocale("en")} type="button">
        English
      </button>
    </>
  );
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("AppLocalizationProvider", () => {
  it("keeps document language and direction aligned with the active locale", async () => {
    const user = userEvent.setup();

    render(
      <AppLocalizationProvider initialLocale="en">
        <LocaleControls />
      </AppLocalizationProvider>,
    );

    expect(document.documentElement).toHaveAttribute("dir", "ltr");
    expect(document.documentElement).toHaveAttribute("lang", "en");

    await user.click(screen.getByRole("button", { name: "Croatian" }));

    await waitFor(() => {
      expect(screen.getByText("hr")).toBeVisible();
      expect(document.documentElement).toHaveAttribute("dir", "ltr");
      expect(document.documentElement).toHaveAttribute("lang", "hr");
    });
  });

  it("keeps a fixed locale over initialization, storage, and setter attempts", async () => {
    appLocalStorage.set(appLocalStorageKeys.locale, "en");
    const user = userEvent.setup();

    const fixed = render(
      <AppLocalizationProvider fixedLocale="hr" initialLocale="en">
        <LocaleControls />
      </AppLocalizationProvider>,
    );

    expect(screen.getByText("hr")).toBeVisible();
    expect(document.documentElement).toHaveAttribute("lang", "hr");

    await user.click(screen.getByRole("button", { name: "English" }));

    expect(screen.getByText("hr")).toBeVisible();
    expect(appLocalStorage.get(appLocalStorageKeys.locale)).toBe("en");

    fixed.unmount();
    render(
      <AppLocalizationProvider initialLocale={resolveInitialLocale()}>
        <LocaleControls />
      </AppLocalizationProvider>,
    );
    expect(screen.getByText("en")).toBeVisible();
  });
});
