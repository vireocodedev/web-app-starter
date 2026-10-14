import { createTheme, type ColorSystemOptions, type CssVarsTheme, type ThemeOptions } from "@mui/material/styles";

import { getApplicationPalette } from "../themeSetup";

function createColorScheme(scheme: "light" | "dark" | "soft-dark", increasedContrast = false) {
  const { rgo } = getApplicationPalette(scheme, increasedContrast);

  return {
    palette: {
      mode: scheme === "light" ? "light" : "dark",
      action: {
        active: rgo.textSecondary,
        disabled: rgo.disabledText,
        disabledBackground: rgo.disabledBg,
        focus: rgo.selection,
        hover: rgo.hover,
        selected: rgo.selection,
      },
      background: {
        default: rgo.canvas,
        paper: rgo.surface,
      },
      divider: rgo.borderSubtle,
      error: {
        contrastText: rgo.onDanger,
        dark: rgo.dangerPressed,
        light: rgo.dangerBg,
        main: rgo.dangerFg,
      },
      info: {
        contrastText: rgo.onAction,
        dark: rgo.infoFg,
        light: rgo.infoBg,
        main: rgo.infoFg,
      },
      primary: {
        contrastText: rgo.onAction,
        dark: rgo.actionPressed,
        light: rgo.actionHover,
        main: rgo.action,
      },
      rgo,
      secondary: {
        contrastText: rgo.surface,
        dark: rgo.text,
        light: rgo.surfaceSubtle,
        main: rgo.textSecondary,
      },
      success: {
        contrastText: rgo.onAction,
        dark: rgo.successFg,
        light: rgo.successBg,
        main: rgo.successFg,
      },
      text: {
        disabled: rgo.disabledText,
        primary: rgo.text,
        secondary: rgo.textSecondary,
      },
      warning: {
        contrastText: rgo.onAction,
        dark: rgo.warningFg,
        light: rgo.warningBg,
        main: rgo.warningFg,
      },
    },
  } satisfies ColorSystemOptions;
}

export const APPLICATION_LIGHT_COLOR_SCHEME = createColorScheme("light");

export const APPLICATION_DARK_COLOR_SCHEME = createColorScheme("dark");

// MUI normalizes only its built-in light/dark scheme names in a multi-scheme
// theme. Normalize Soft dark through the built-in dark path before registering
// it under its public custom name, so component palette tokens are complete.
function createSoftDarkColorScheme(increasedContrast = false) {
  return (
    createTheme({
      cssVariables: true,
      // This temporary theme normalizes a dark scheme before it is given a custom
      // name. MUI's type requires custom schemes in every theme once augmented.
      colorSchemes: { dark: createColorScheme("soft-dark", increasedContrast) },
    } as unknown as ThemeOptions) as unknown as CssVarsTheme
  ).colorSchemes.dark!;
}

export const APPLICATION_SOFT_DARK_COLOR_SCHEME = createSoftDarkColorScheme();

export const APPLICATION_COLOR_SCHEMES = {
  dark: APPLICATION_DARK_COLOR_SCHEME,
  light: APPLICATION_LIGHT_COLOR_SCHEME,
  "soft-dark": APPLICATION_SOFT_DARK_COLOR_SCHEME,
} satisfies Record<"light" | "dark" | "soft-dark", ColorSystemOptions>;

/** Full MUI schemes keep component palette reads and generated CSS variables in sync. */
export const APPLICATION_INCREASED_CONTRAST_COLOR_SCHEMES = {
  dark: createColorScheme("dark", true),
  light: createColorScheme("light", true),
  "soft-dark": createSoftDarkColorScheme(true),
} satisfies Record<"light" | "dark" | "soft-dark", ColorSystemOptions>;
