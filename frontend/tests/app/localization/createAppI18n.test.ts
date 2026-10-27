import { describe, expect, it, vi } from "vitest";
import { createAppI18n } from "@/app/localization/createAppI18n";

describe("createAppI18n", () => {
  it.each([true, false])("registers only application resources with DEV=%s", isDevelopment => {
    vi.stubEnv("DEV", isDevelopment);
    try {
      const i18n = createAppI18n("en");
      expect(i18n.options.ns).toEqual(["translation"]);
      for (const locale of ["en", "hr"]) {
        expect(Object.keys(i18n.store.data[locale] ?? {})).toEqual(["translation"]);
      }
      expect(i18n.t("navigation.home")).toBe("Home");
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it("switches application translations independently of other instances", async () => {
    const first = createAppI18n("en");
    const second = createAppI18n("en");
    await first.changeLanguage("hr");
    expect(first.t("navigation.home")).toBe("Početna");
    expect(second.t("navigation.home")).toBe("Home");
  });
});
