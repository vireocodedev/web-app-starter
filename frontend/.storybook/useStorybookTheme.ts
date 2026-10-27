import { useSyncExternalStore } from "react";

import { resolveStorybookColorScheme } from "./theme.js";
import { getStorybookThemeMode, subscribeStorybookTheme } from "./themeSync.js";

function subscribeSystemTheme(listener: () => void) {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

export function useStorybookTheme() {
  const mode = useSyncExternalStore(subscribeStorybookTheme, getStorybookThemeMode, () => "system" as const);
  const systemDark = useSyncExternalStore(
    subscribeSystemTheme,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
  return { mode, scheme: resolveStorybookColorScheme(mode, systemDark) };
}
