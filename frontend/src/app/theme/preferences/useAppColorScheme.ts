import { useColorScheme } from "@mui/material/styles";
import { useCallback } from "react";

import type { ApplicationColorMode } from "../themeSetup";
import { useAppDisplayPreferences } from "./useAppDisplayPreferences";

/** The application preference keeps Soft dark distinct from MUI's dark mode. */
export function useAppColorScheme() {
  const { darkColorScheme, mode, setColorScheme, setMode, systemMode } = useColorScheme();
  const { fixedColorMode } = useAppDisplayPreferences();
  const setAppMode = useCallback(
    (nextMode: ApplicationColorMode) => {
      if (fixedColorMode !== undefined) return;
      // System and the ordinary Dark choice always use the default dark scheme.
      setColorScheme({ dark: nextMode === "soft-dark" ? "soft-dark" : "dark" });
      setMode(nextMode === "soft-dark" ? "dark" : nextMode);
    },
    [fixedColorMode, setColorScheme, setMode],
  );

  return {
    mode: fixedColorMode ?? (mode === "dark" && darkColorScheme === "soft-dark" ? "soft-dark" : mode),
    setMode: setAppMode,
    systemMode,
  } as const;
}
