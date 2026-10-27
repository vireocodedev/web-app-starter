import { create } from "storybook/theming/create";

import { getApplicationPalette, themeSetup, type ApplicationColorMode } from "../src/app/theme/themeSetup.js";

export type StorybookThemeMode = ApplicationColorMode;
export type StorybookColorScheme = Exclude<StorybookThemeMode, "system">;

export function isStorybookThemeMode(value: unknown): value is StorybookThemeMode {
  return value === "system" || value === "light" || value === "dark" || value === "soft-dark";
}

export function resolveStorybookColorScheme(mode: StorybookThemeMode, systemDark: boolean): StorybookColorScheme {
  return mode === "system" ? (systemDark ? "dark" : "light") : mode;
}

function createStorybookTheme(mode: StorybookColorScheme) {
  const { rgo } = getApplicationPalette(mode);
  return create({
    base: mode === "light" ? "light" : "dark",
    fontBase: themeSetup.fontFamily,
    fontCode: "ui-monospace, SFMono-Regular, Menlo, monospace",
    appBg: rgo.shellSurface,
    appContentBg: rgo.canvas,
    appPreviewBg: rgo.canvas,
    appBorderColor: rgo.borderSubtle,
    appBorderRadius: themeSetup.shape.surfaceBorderRadius,
    barBg: rgo.shellSurface,
    barTextColor: rgo.textSecondary,
    barHoverColor: rgo.text,
    barSelectedColor: rgo.action,
    colorPrimary: rgo.brand,
    colorSecondary: rgo.action,
    textColor: rgo.text,
    textMutedColor: rgo.textMuted,
    textInverseColor: rgo.onAction,
    inputBg: rgo.surface,
    inputBorder: rgo.borderControl,
    inputTextColor: rgo.text,
    buttonBg: rgo.surface,
    buttonBorder: rgo.borderSubtle,
  });
}

export const storybookThemes = {
  light: createStorybookTheme("light"),
  dark: createStorybookTheme("dark"),
  "soft-dark": createStorybookTheme("soft-dark"),
};
