import type { StorageManager } from "@mui/material/styles";

import { appLocalStorage, appLocalStorageKeys } from "@/app/data/storage/appLocalStorage";

import type { ApplicationColorMode } from "./themeSetup";

export const appThemeModeStorageKey = appLocalStorageKeys.colorMode;
export const appThemeColorSchemeStorageKey = "rgo.app.color-scheme";

function isColorMode(value: unknown): value is "light" | "dark" {
  return value === "light" || value === "dark";
}

function isDarkColorScheme(value: unknown): value is "dark" | "soft-dark" {
  return value === "dark" || value === "soft-dark";
}

/**
 * Adapts MUI's mode and named dark-scheme slots to typed application storage.
 * The original color-mode key remains light/dark/null for existing users.
 */
export function createAppThemeStorageManager(fixedMode?: ApplicationColorMode): StorageManager {
  return ({ key, storageWindow }) => {
    const ownsColorMode = key === appThemeModeStorageKey;
    const ownsDarkColorScheme = key === `${appThemeColorSchemeStorageKey}-dark`;

    return {
      get(defaultValue) {
        if (ownsColorMode) {
          if (fixedMode !== undefined) return fixedMode === "soft-dark" ? "dark" : fixedMode;
          return appLocalStorage.get(appLocalStorageKeys.colorMode) ?? defaultValue;
        }
        if (ownsDarkColorScheme) {
          if (fixedMode !== undefined) return fixedMode === "soft-dark" ? "soft-dark" : "dark";
          return appLocalStorage.get(appLocalStorageKeys.darkColorScheme) ?? defaultValue;
        }
        return defaultValue;
      },
      set(value) {
        if (fixedMode !== undefined) return;

        if (ownsColorMode && (value === "system" || isColorMode(value))) {
          try {
            appLocalStorage.set(appLocalStorageKeys.colorMode, isColorMode(value) ? value : null);
          } catch {
            // Theme changes remain usable when browser storage is blocked or full.
          }
        } else if (ownsDarkColorScheme && isDarkColorScheme(value)) {
          try {
            appLocalStorage.set(appLocalStorageKeys.darkColorScheme, value === "soft-dark" ? value : null);
          } catch {
            // The active dark scheme remains usable when storage is unavailable.
          }
        }
      },
      subscribe(handler) {
        if ((!ownsColorMode && !ownsDarkColorScheme) || !storageWindow) return () => undefined;

        const storageKey = ownsColorMode ? appLocalStorageKeys.colorMode : appLocalStorageKeys.darkColorScheme;
        const onStorage = (event: StorageEvent) => {
          if (event.key !== null && event.key !== storageKey) return;

          if (ownsColorMode) {
            handler(
              fixedMode === "soft-dark" ? "dark" : (fixedMode ?? appLocalStorage.get(appLocalStorageKeys.colorMode)),
            );
          } else {
            handler(
              fixedMode !== undefined
                ? fixedMode === "soft-dark"
                  ? "soft-dark"
                  : "dark"
                : appLocalStorage.get(appLocalStorageKeys.darkColorScheme),
            );
          }
        };

        storageWindow.addEventListener("storage", onStorage);
        return () => storageWindow.removeEventListener("storage", onStorage);
      },
    };
  };
}

export const appThemeStorageManager = createAppThemeStorageManager();
