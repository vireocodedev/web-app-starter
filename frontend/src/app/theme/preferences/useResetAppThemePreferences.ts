import { useCallback } from "react";

import { themeSetup } from "../themeSetup";
import { useAppDisplayPreferences } from "./useAppDisplayPreferences";
import { useAppColorScheme } from "./useAppColorScheme";

/** Restores every theme-owned preference to its configured application default. */
export function useResetAppThemePreferences(): () => void {
  const { setMode } = useAppColorScheme();
  const { setDesktopTableSize, setEditorPresentation, setFontSize, setIncreasedContrast, setSurfaceBorderRadius } =
    useAppDisplayPreferences();

  return useCallback(() => {
    setDesktopTableSize(themeSetup.defaultDesktopTableSize);
    setEditorPresentation(themeSetup.defaultEditorPresentation);
    setFontSize(themeSetup.defaultFontSize);
    setIncreasedContrast(themeSetup.defaultIncreasedContrast);
    setSurfaceBorderRadius(themeSetup.shape.surfaceBorderRadius);
    setMode(themeSetup.defaultMode);
  }, [setDesktopTableSize, setEditorPresentation, setFontSize, setIncreasedContrast, setMode, setSurfaceBorderRadius]);
}
