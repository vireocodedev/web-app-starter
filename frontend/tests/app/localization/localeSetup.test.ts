import { describe, expect, it } from "vitest";

import { appLocales, defaultAppLocale, isAppLocale } from "@/app/localization/localeConfig";
import { muiLocaleOptions, translationResources } from "@/app/localization/localeSetup";

describe("localeSetup", () => {
  it("keeps every locale registration exhaustive", () => {
    expect(Object.keys(muiLocaleOptions)).toEqual(appLocales);
    expect(Object.keys(translationResources)).toEqual(appLocales);
    for (const locale of appLocales) {
      expect(Object.keys(translationResources[locale])).toEqual(["translation"]);
    }
    expect(appLocales).toContain(defaultAppLocale);
  });

  it("narrows only registered locale codes", () => {
    expect(isAppLocale("en")).toBe(true);
    expect(isAppLocale("hr")).toBe(true);
    expect(isAppLocale("de")).toBe(false);
    expect(isAppLocale(null)).toBe(false);
  });
});
