import { describe, expect, it } from "vitest";

import { parseAppConfig } from "@/app/bootstrap/config/appConfig";
import { createAppFixedSettings, noFixedAppSettings } from "@/app/bootstrap/config/fixedSettings";
import { loadAppConfig } from "@/app/bootstrap/config/loadAppConfig";

const baseEnvironment = {
  VITE_API_BASE_URL: "https://api.example.test",
};

const acceptedValues = {
  VITE_SETTINGS_NOCFG_DESKTOP_TABLE_SIZE: ["small", "medium"],
  VITE_SETTINGS_NOCFG_EDITOR_PRESENTATION: ["dialog", "docked", "overlay"],
  VITE_SETTINGS_NOCFG_FONT_SIZE: ["normal", "medium", "big"],
  VITE_SETTINGS_NOCFG_INCREASED_CONTRAST: ["true", "false"],
  VITE_SETTINGS_NOCFG_LOCALE: ["en", "hr"],
  VITE_SETTINGS_NOCFG_MOTION: ["system", "reduce"],
  VITE_SETTINGS_NOCFG_LINK_UNDERLINES: ["page", "always"],
  VITE_SETTINGS_NOCFG_DRAWER_MODE: ["temporary", "permanent"],
  VITE_SETTINGS_NOCFG_HEADER_STICKINESS: ["first-row", "both-rows", "none"],
  VITE_SETTINGS_NOCFG_SURFACE_BORDER_RADIUS: ["6", "8", "10", "12", "14", "16", "18"],
  VITE_SETTINGS_NOCFG_THEME: ["system", "light", "dark", "soft-dark"],
} as const;

describe("fixed settings configuration", () => {
  it("keeps every setting configurable when optional inputs are absent", () => {
    expect(createAppFixedSettings(parseAppConfig(baseEnvironment))).toEqual(noFixedAppSettings);
  });

  it.each(Object.entries(acceptedValues).flatMap(([key, values]) => values.map(value => ({ key, value }))))(
    "accepts $key=$value",
    ({ key, value }) => {
      expect(() => parseAppConfig({ ...baseEnvironment, [key]: value })).not.toThrow();
    },
  );

  it.each(Object.keys(acceptedValues))("rejects an unsupported %s value", key => {
    expect(() => parseAppConfig({ ...baseEnvironment, [key]: "unsupported" })).toThrow();
  });

  it("normalizes deployment values into application domain values", () => {
    const docked = createAppFixedSettings(
      parseAppConfig({
        ...baseEnvironment,
        VITE_SETTINGS_NOCFG_DRAWER_MODE: "permanent",
        VITE_SETTINGS_NOCFG_HEADER_STICKINESS: "both-rows",
        VITE_SETTINGS_NOCFG_EDITOR_PRESENTATION: "docked",
        VITE_SETTINGS_NOCFG_SURFACE_BORDER_RADIUS: "16",
        VITE_SETTINGS_NOCFG_MOTION: "reduce",
        VITE_SETTINGS_NOCFG_INCREASED_CONTRAST: "true",
        VITE_SETTINGS_NOCFG_LINK_UNDERLINES: "always",
      }),
    );
    const overlay = createAppFixedSettings(
      parseAppConfig({
        ...baseEnvironment,
        VITE_SETTINGS_NOCFG_EDITOR_PRESENTATION: "overlay",
      }),
    );

    expect(docked).toMatchObject({
      drawerMode: "permanent",
      headerStickiness: "both-rows",
      editorPresentation: "docked-panel",
      surfaceBorderRadius: 16,
      motion: "reduce",
      increasedContrast: true,
      linkUnderlines: "always",
    });
    expect(overlay.editorPresentation).toBe("overlay-panel");
    expect(Object.isFrozen(docked)).toBe(true);
  });

  it("continues rejecting unknown public variables", () => {
    expect(() =>
      loadAppConfig({ ...baseEnvironment, VITE_SETTINGS_NOCFG_UNKNOWN: "value" }, { isProductionBuild: false }),
    ).toThrow("Unknown public configuration: VITE_SETTINGS_NOCFG_UNKNOWN");
  });
});
