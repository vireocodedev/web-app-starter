import { RgoLocalStorageService } from "@rgo-web/frontend";
import { z } from "zod";

import { appLocales } from "@/app/localization/localeConfig";
export const appLocalStorageKeys = {
  colorMode: "rgo.app.color-mode",
  darkColorScheme: "rgo.app.dark-color-scheme",
  applicationStateExample: "rgo.app.application-state-example",
  desktopTableSize: "rgo.app.desktop-table-size",
  editorPresentation: "rgo.app.editor-presentation",
  fontSize: "rgo.app.font-size",
  fontSizeScaleVersion: "rgo.app.font-size-scale-version",
  increasedContrast: "rgo.app.increased-contrast",
  locale: "rgo.app.locale",
  motion: "rgo.app.motion",
  linkUnderlines: "rgo.app.link-underlines",
  drawerMode: "rgo.app.drawer-mode",
  headerStickiness: "rgo.app.header-stickiness",
  permanentDrawerOpen: "rgo.app.permanent-drawer-open",
  permanentDrawerCollapsed: "rgo.app.permanent-drawer-collapsed",
  surfaceBorderRadius: "rgo.app.surface-border-radius",
} as const;

const appLocalStorageSchema = z.object({
  [appLocalStorageKeys.applicationStateExample]: z.object({
    hourlyRate: z.number().finite().nonnegative(),
    hours: z.number().finite().nonnegative(),
  }),
  // Null means no explicit user override: MUI should use the system preference.
  [appLocalStorageKeys.colorMode]: z.enum(["light", "dark"]).nullable(),
  [appLocalStorageKeys.darkColorScheme]: z.enum(["soft-dark"]).nullable(),
  [appLocalStorageKeys.desktopTableSize]: z.enum(["small", "medium"]).nullable(),
  [appLocalStorageKeys.editorPresentation]: z.enum(["dialog", "docked-panel", "overlay-panel"]).nullable(),
  [appLocalStorageKeys.fontSize]: z.enum(["normal", "medium", "big"]).nullable(),
  [appLocalStorageKeys.fontSizeScaleVersion]: z.literal(2).nullable(),
  [appLocalStorageKeys.increasedContrast]: z.boolean().nullable(),
  [appLocalStorageKeys.locale]: z.enum(appLocales).nullable(),
  [appLocalStorageKeys.motion]: z.enum(["system", "reduce"]).nullable(),
  [appLocalStorageKeys.linkUnderlines]: z.enum(["page", "always"]).nullable(),
  [appLocalStorageKeys.drawerMode]: z.enum(["temporary", "permanent"]).nullable(),
  [appLocalStorageKeys.headerStickiness]: z.enum(["first-row", "both-rows", "none"]).nullable(),
  [appLocalStorageKeys.permanentDrawerOpen]: z.boolean().nullable(),
  [appLocalStorageKeys.permanentDrawerCollapsed]: z.boolean().nullable(),
  [appLocalStorageKeys.surfaceBorderRadius]: z.number().int().nullable(),
});

const appLocalStorageDefaultValues = {
  [appLocalStorageKeys.applicationStateExample]: {
    hourlyRate: 75,
    hours: 8,
  },
  [appLocalStorageKeys.colorMode]: null,
  [appLocalStorageKeys.darkColorScheme]: null,
  [appLocalStorageKeys.desktopTableSize]: null,
  [appLocalStorageKeys.editorPresentation]: null,
  [appLocalStorageKeys.fontSize]: null,
  [appLocalStorageKeys.fontSizeScaleVersion]: null,
  [appLocalStorageKeys.increasedContrast]: null,
  [appLocalStorageKeys.locale]: null,
  [appLocalStorageKeys.motion]: null,
  [appLocalStorageKeys.linkUnderlines]: null,
  [appLocalStorageKeys.drawerMode]: null,
  [appLocalStorageKeys.headerStickiness]: null,
  [appLocalStorageKeys.permanentDrawerOpen]: null,
  [appLocalStorageKeys.permanentDrawerCollapsed]: null,
  [appLocalStorageKeys.surfaceBorderRadius]: null,
} satisfies z.output<typeof appLocalStorageSchema>;

export const appLocalStorage = new RgoLocalStorageService(appLocalStorageSchema, appLocalStorageDefaultValues);

/** Preserve the old 112.5% choice when a pre-three-level `big` value is loaded. */
export function readAppFontSizePreference() {
  const saved = appLocalStorage.get(appLocalStorageKeys.fontSize);
  return appLocalStorage.get(appLocalStorageKeys.fontSizeScaleVersion) === null && saved === "big" ? "medium" : saved;
}

/** Mark the new scale once, converting the old `big` value before it can mean 125%. */
export function migrateAppFontSizePreference(): void {
  if (appLocalStorage.get(appLocalStorageKeys.fontSizeScaleVersion) !== null) return;
  try {
    if (appLocalStorage.get(appLocalStorageKeys.fontSize) === "big") {
      appLocalStorage.set(appLocalStorageKeys.fontSize, "medium");
    }
    appLocalStorage.set(appLocalStorageKeys.fontSizeScaleVersion, 2);
  } catch {
    // The live preference remains usable when browser storage is unavailable.
  }
}

/** Removes settings retired by the shell redesign without changing current typed preferences. */
export function clearObsoleteShellStorageKeys(): void {
  for (const key of [
    "rgo.app.navigation-placement",
    "rgo.app.compact-navigation-icons-only",
    "rgo.app.left-panel-locked",
    "rgo.app.left-panel-state",
  ]) {
    try {
      globalThis.localStorage.removeItem(key);
    } catch {
      // Live preferences remain usable when browser storage is unavailable.
    }
  }
}
