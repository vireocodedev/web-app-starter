import { afterEach, describe, expect, it, vi } from "vitest";

import { appLocalStorage, appLocalStorageKeys } from "@/app/data/storage/appLocalStorage";

import { defaultAppLocale } from "@/app/localization/localeConfig";
import { resolveInitialLocale } from "@/app/localization/preferences/localePreference";

function setBrowserLanguages(languages: readonly string[]) {
  vi.stubGlobal("navigator", {
    language: languages[0] ?? "",
    languages,
  });
}

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("localePreference", () => {
  it("prefers a valid stored locale over browser preferences", () => {
    setBrowserLanguages(["en-US"]);
    appLocalStorage.set(appLocalStorageKeys.locale, "hr");

    expect(resolveInitialLocale()).toBe("hr");
  });

  it("uses the first supported browser language when no preference is stored", () => {
    setBrowserLanguages(["de-DE", "hr-HR", "en-US"]);

    expect(resolveInitialLocale()).toBe("hr");
  });

  it("falls back when browser languages are unsupported", () => {
    setBrowserLanguages(["de-DE", "fr-FR"]);

    expect(resolveInitialLocale()).toBe(defaultAppLocale);
  });

  it("repairs an unregistered stored locale before resolving the browser fallback", () => {
    setBrowserLanguages(["hr-HR"]);
    localStorage.setItem(appLocalStorageKeys.locale, '"de"');

    expect(resolveInitialLocale()).toBe("hr");
    expect(appLocalStorage.get(appLocalStorageKeys.locale)).toBeNull();
  });
});
