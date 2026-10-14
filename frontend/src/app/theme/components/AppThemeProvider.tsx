import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";

import { CssBaseline, GlobalStyles, ThemeProvider } from "@mui/material";
import type { Localization } from "@mui/material/locale";
import { useColorScheme } from "@mui/material/styles";
import type { PropsWithChildren } from "react";
import { useLayoutEffect, useMemo } from "react";

import type { AppFixedSettings } from "@/app/bootstrap/config/fixedSettings";

import {
  appThemeColorSchemeStorageKey,
  appThemeModeStorageKey,
  createAppThemeStorageManager,
} from "../appThemeStorageManager";
import { createApplicationTheme } from "../config/theme";
import { AppAccessibilityPreferencesProvider } from "../preferences/AppAccessibilityPreferencesProvider";
import { useAppAccessibilityPreferences } from "../preferences/useAppAccessibilityPreferences";
import { AppDisplayPreferencesProvider } from "../preferences/AppDisplayPreferencesProvider";
import { useAppDisplayPreferences } from "../preferences/useAppDisplayPreferences";
import { themeSetup } from "../themeSetup";

type AppThemeProviderProps = PropsWithChildren<{
  direction?: "ltr" | "rtl";
  fixedSettings?: AppFixedSettings;
  localeOptions?: Localization;
}>;

type FixedColorModeGuardProps = PropsWithChildren<{
  fixedMode: AppFixedSettings["theme"];
}>;

export function AppThemeProvider({ children, fixedSettings, ...props }: AppThemeProviderProps) {
  return (
    <AppDisplayPreferencesProvider fixedSettings={fixedSettings}>
      <AppAccessibilityPreferencesProvider fixedSettings={fixedSettings}>
        <ConfiguredAppThemeProvider fixedSettings={fixedSettings} {...props}>
          {children}
        </ConfiguredAppThemeProvider>
      </AppAccessibilityPreferencesProvider>
    </AppDisplayPreferencesProvider>
  );
}

function ConfiguredAppThemeProvider({ children, direction, fixedSettings, localeOptions }: AppThemeProviderProps) {
  const { fontSize, increasedContrast, surfaceBorderRadius } = useAppDisplayPreferences();
  const { linkUnderlines, motion } = useAppAccessibilityPreferences();
  const theme = useMemo(
    () =>
      createApplicationTheme(
        {
          ...localeOptions,
          direction,
          motion: { reducedMotion: motion === "reduce" ? "always" : "system" },
        },
        surfaceBorderRadius,
        increasedContrast,
      ),
    [direction, increasedContrast, localeOptions, motion, surfaceBorderRadius],
  );
  const storageManager = useMemo(() => createAppThemeStorageManager(fixedSettings?.theme), [fixedSettings?.theme]);

  return (
    <ThemeProvider
      colorSchemeStorageKey={appThemeColorSchemeStorageKey}
      defaultMode={fixedSettings?.theme === "soft-dark" ? "dark" : (fixedSettings?.theme ?? themeSetup.defaultMode)}
      modeStorageKey={appThemeModeStorageKey}
      storageManager={storageManager}
      theme={theme}
    >
      <FixedColorModeGuard fixedMode={fixedSettings?.theme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            html: {
              fontSize: fontSize === "big" ? "125%" : fontSize === "medium" ? "112.5%" : "100%",
            },
            ...(motion === "reduce"
              ? {
                  "html *, html *::before, html *::after": {
                    // Keep CSS animations, including progress indicators, running.
                    transitionDuration: "0.01ms !important",
                  },
                }
              : {
                  "@media (prefers-reduced-motion: reduce)": {
                    "html *, html *::before, html *::after": {
                      transitionDuration: "0.01ms !important",
                    },
                  },
                }),
            ...(linkUnderlines === "always"
              ? {
                  "main :is(p, li, blockquote, dd, figcaption) a:not(aside a, button a, [role='button'], .MuiButtonBase-root)":
                    {
                      textDecoration: "underline !important",
                    },
                }
              : {}),
          }}
        />
        {children}
      </FixedColorModeGuard>
    </ThemeProvider>
  );
}

function FixedColorModeGuard({ children, fixedMode }: FixedColorModeGuardProps) {
  const { darkColorScheme, mode, setColorScheme, setMode } = useColorScheme();
  useLayoutEffect(() => {
    if (fixedMode === undefined) return;
    const requiredMode = fixedMode === "soft-dark" ? "dark" : fixedMode;
    const requiredDarkScheme = fixedMode === "soft-dark" ? "soft-dark" : "dark";
    if (darkColorScheme !== requiredDarkScheme) {
      setColorScheme({ dark: requiredDarkScheme });
    }
    if (mode !== requiredMode) {
      setMode(requiredMode);
    }
  }, [darkColorScheme, fixedMode, mode, setColorScheme, setMode]);

  return children;
}
