export type AppFixedSettings = Readonly<{
  desktopTableSize: "small" | "medium" | undefined;
  drawerMode: "temporary" | "permanent" | undefined;
  editorPresentation: "dialog" | "docked-panel" | "overlay-panel" | undefined;
  fontSize: "normal" | "medium" | "big" | undefined;
  increasedContrast: boolean | undefined;
  headerStickiness: "first-row" | "both-rows" | "none" | undefined;
  locale: "en" | "hr" | undefined;
  motion: "system" | "reduce" | undefined;
  linkUnderlines: "page" | "always" | undefined;
  surfaceBorderRadius: number | undefined;
  theme: "system" | "light" | "dark" | "soft-dark" | undefined;
}>;

type FixedSettingsConfig = Readonly<{
  VITE_SETTINGS_NOCFG_DESKTOP_TABLE_SIZE?: "small" | "medium";
  VITE_SETTINGS_NOCFG_DRAWER_MODE?: "temporary" | "permanent";
  VITE_SETTINGS_NOCFG_EDITOR_PRESENTATION?: "dialog" | "docked" | "overlay";
  VITE_SETTINGS_NOCFG_FONT_SIZE?: "normal" | "medium" | "big";
  VITE_SETTINGS_NOCFG_INCREASED_CONTRAST?: boolean;
  VITE_SETTINGS_NOCFG_HEADER_STICKINESS?: "first-row" | "both-rows" | "none";
  VITE_SETTINGS_NOCFG_LOCALE?: "en" | "hr";
  VITE_SETTINGS_NOCFG_MOTION?: "system" | "reduce";
  VITE_SETTINGS_NOCFG_LINK_UNDERLINES?: "page" | "always";
  VITE_SETTINGS_NOCFG_SURFACE_BORDER_RADIUS?: number;
  VITE_SETTINGS_NOCFG_THEME?: "system" | "light" | "dark" | "soft-dark";
}>;

export const noFixedAppSettings: AppFixedSettings = Object.freeze({
  desktopTableSize: undefined,
  drawerMode: undefined,
  editorPresentation: undefined,
  fontSize: undefined,
  increasedContrast: undefined,
  headerStickiness: undefined,
  locale: undefined,
  motion: undefined,
  linkUnderlines: undefined,
  surfaceBorderRadius: undefined,
  theme: undefined,
});

/** Converts deployment-facing environment values into application domain values. */
export function createAppFixedSettings(config: FixedSettingsConfig): AppFixedSettings {
  const editorPresentation =
    config.VITE_SETTINGS_NOCFG_EDITOR_PRESENTATION === "docked"
      ? "docked-panel"
      : config.VITE_SETTINGS_NOCFG_EDITOR_PRESENTATION === "overlay"
        ? "overlay-panel"
        : config.VITE_SETTINGS_NOCFG_EDITOR_PRESENTATION;

  return Object.freeze({
    desktopTableSize: config.VITE_SETTINGS_NOCFG_DESKTOP_TABLE_SIZE,
    drawerMode: config.VITE_SETTINGS_NOCFG_DRAWER_MODE,
    editorPresentation,
    fontSize: config.VITE_SETTINGS_NOCFG_FONT_SIZE,
    increasedContrast: config.VITE_SETTINGS_NOCFG_INCREASED_CONTRAST,
    headerStickiness: config.VITE_SETTINGS_NOCFG_HEADER_STICKINESS,
    locale: config.VITE_SETTINGS_NOCFG_LOCALE,
    motion: config.VITE_SETTINGS_NOCFG_MOTION,
    linkUnderlines: config.VITE_SETTINGS_NOCFG_LINK_UNDERLINES,
    surfaceBorderRadius: config.VITE_SETTINGS_NOCFG_SURFACE_BORDER_RADIUS,
    theme: config.VITE_SETTINGS_NOCFG_THEME,
  });
}
