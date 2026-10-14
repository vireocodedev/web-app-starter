import { describe, expect, it, vi } from "vitest";

import { createAppI18n } from "@/app/localization/createAppI18n";

const guideArticleKey = "architectureGuide.articles.sourceMapAndOwnership";

describe("createAppI18n", () => {
  it("registers the development guide namespace synchronously alongside application translations", () => {
    const i18n = createAppI18n("en");

    expect(i18n.hasResourceBundle("en", "translation")).toBe(true);
    expect(i18n.hasResourceBundle("hr", "translation")).toBe(true);
    expect(i18n.hasResourceBundle("en", "development-guide")).toBe(true);
    expect(i18n.hasResourceBundle("hr", "development-guide")).toBe(true);
    expect(i18n.t(guideArticleKey, { ns: "development-guide" })).toBe("Source map and ownership");
    expect(i18n.t("navigation.home")).toBe("Home");
  });

  it("registers only application translations in production mode", () => {
    vi.stubEnv("DEV", false);

    try {
      const i18n = createAppI18n("en");

      expect(i18n.options.ns).toEqual(["translation"]);
      expect(i18n.hasResourceBundle("en", "translation")).toBe(true);
      expect(i18n.hasResourceBundle("hr", "translation")).toBe(true);
      expect(i18n.hasResourceBundle("en", "development-guide")).toBe(false);
      expect(i18n.hasResourceBundle("hr", "development-guide")).toBe(false);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("switches guide and application translations together", async () => {
    const i18n = createAppI18n("en");

    await i18n.changeLanguage("hr");

    expect(i18n.t(guideArticleKey, { ns: "development-guide" })).toBe("Karta izvornog koda i vlasništvo");
    expect(i18n.t("navigation.home")).toBe("Početna");
    expect(i18n.t("navigation.architecture", { ns: "development-guide" })).toBe("Arhitektura");
  });
});
