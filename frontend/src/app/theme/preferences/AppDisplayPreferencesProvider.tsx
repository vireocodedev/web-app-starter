import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import {
  appLocalStorage,
  appLocalStorageKeys,
  migrateAppFontSizePreference,
  readAppFontSizePreference,
} from "@/app/data/storage/appLocalStorage";
import type { AppFixedSettings } from "@/app/bootstrap/config/fixedSettings";

import {
  normalizeApplicationSurfaceBorderRadius,
  themeSetup,
  type AppDesktopTableSize,
  type AppEditorPresentation,
  type AppFontSize,
} from "../themeSetup";
import { AppDisplayPreferencesContext } from "./AppDisplayPreferencesContext";

/** Owns persisted application display and editor-presentation preferences. */
export function AppDisplayPreferencesProvider({
  children,
  fixedSettings,
}: PropsWithChildren<{ fixedSettings?: AppFixedSettings }>) {
  const [desktopTableSize, setDesktopTableSizeState] = useState<AppDesktopTableSize>(
    () =>
      fixedSettings?.desktopTableSize ??
      appLocalStorage.get(appLocalStorageKeys.desktopTableSize) ??
      themeSetup.defaultDesktopTableSize,
  );
  const [editorPresentation, setEditorPresentationState] = useState<AppEditorPresentation>(
    () =>
      fixedSettings?.editorPresentation ??
      appLocalStorage.get(appLocalStorageKeys.editorPresentation) ??
      themeSetup.defaultEditorPresentation,
  );
  const [fontSize, setFontSizeState] = useState(
    () => fixedSettings?.fontSize ?? readAppFontSizePreference() ?? themeSetup.defaultFontSize,
  );
  const [increasedContrast, setIncreasedContrastState] = useState(
    () =>
      fixedSettings?.increasedContrast ??
      appLocalStorage.get(appLocalStorageKeys.increasedContrast) ??
      themeSetup.defaultIncreasedContrast,
  );
  const [surfaceBorderRadius, setSurfaceBorderRadiusState] = useState(() =>
    normalizeApplicationSurfaceBorderRadius(
      fixedSettings?.surfaceBorderRadius ??
        appLocalStorage.get(appLocalStorageKeys.surfaceBorderRadius) ??
        themeSetup.shape.surfaceBorderRadius,
    ),
  );

  useEffect(migrateAppFontSizePreference, []);

  const setFontSize = useCallback(
    (next: AppFontSize) => {
      if (fixedSettings?.fontSize !== undefined) return;
      setFontSizeState(next);

      try {
        appLocalStorage.set(appLocalStorageKeys.fontSize, next);
      } catch {
        // The live preference remains usable when browser storage is unavailable.
      }
    },
    [fixedSettings?.fontSize],
  );

  const setDesktopTableSize = useCallback(
    (size: AppDesktopTableSize) => {
      if (fixedSettings?.desktopTableSize !== undefined) return;
      setDesktopTableSizeState(size);

      try {
        appLocalStorage.set(appLocalStorageKeys.desktopTableSize, size);
      } catch {
        // The live preference remains usable when browser storage is unavailable.
      }
    },
    [fixedSettings?.desktopTableSize],
  );

  const setEditorPresentation = useCallback(
    (presentation: AppEditorPresentation) => {
      if (fixedSettings?.editorPresentation !== undefined) return;
      setEditorPresentationState(presentation);

      try {
        appLocalStorage.set(appLocalStorageKeys.editorPresentation, presentation);
      } catch {
        // The live preference remains usable when browser storage is unavailable.
      }
    },
    [fixedSettings?.editorPresentation],
  );

  const setIncreasedContrast = useCallback(
    (next: boolean) => {
      if (fixedSettings?.increasedContrast !== undefined) return;
      setIncreasedContrastState(next);

      try {
        appLocalStorage.set(appLocalStorageKeys.increasedContrast, next);
      } catch {
        // The live preference remains usable when browser storage is unavailable.
      }
    },
    [fixedSettings?.increasedContrast],
  );

  const setSurfaceBorderRadius = useCallback(
    (next: number) => {
      if (fixedSettings?.surfaceBorderRadius !== undefined) return;
      const normalized = normalizeApplicationSurfaceBorderRadius(next);
      setSurfaceBorderRadiusState(normalized);

      try {
        appLocalStorage.set(appLocalStorageKeys.surfaceBorderRadius, normalized);
      } catch {
        // The live preference remains usable when browser storage is unavailable.
      }
    },
    [fixedSettings?.surfaceBorderRadius],
  );

  const value = useMemo(
    () => ({
      desktopTableSize,
      editorPresentation,
      fixedColorMode: fixedSettings?.theme,
      fontSize,
      increasedContrast,
      setDesktopTableSize,
      setEditorPresentation,
      setFontSize,
      setIncreasedContrast,
      setSurfaceBorderRadius,
      surfaceBorderRadius,
    }),
    [
      desktopTableSize,
      editorPresentation,
      fixedSettings?.theme,
      fontSize,
      increasedContrast,
      setDesktopTableSize,
      setEditorPresentation,
      setFontSize,
      setIncreasedContrast,
      setSurfaceBorderRadius,
      surfaceBorderRadius,
    ],
  );

  return <AppDisplayPreferencesContext.Provider value={value}>{children}</AppDisplayPreferencesContext.Provider>;
}
