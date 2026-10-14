import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import type { AppFixedSettings } from "@/app/bootstrap/config/fixedSettings";
import { appLocalStorage, appLocalStorageKeys } from "@/app/data/storage/appLocalStorage";

import { themeSetup, type AppLinkUnderlinePreference, type AppMotionPreference } from "../themeSetup";
import { AppAccessibilityPreferencesContext } from "./AppAccessibilityPreferencesContext";

/** Owns persisted, app-wide accessibility choices independently of Settings. */
export function AppAccessibilityPreferencesProvider({
  children,
  fixedSettings,
}: PropsWithChildren<{ fixedSettings?: AppFixedSettings }>) {
  const [motion, setMotionState] = useState<AppMotionPreference>(
    () => appLocalStorage.get(appLocalStorageKeys.motion) ?? themeSetup.defaultMotion,
  );
  const [linkUnderlines, setLinkUnderlinesState] = useState<AppLinkUnderlinePreference>(
    () => appLocalStorage.get(appLocalStorageKeys.linkUnderlines) ?? themeSetup.defaultLinkUnderlines,
  );

  const setMotion = useCallback(
    (next: AppMotionPreference) => {
      if (fixedSettings?.motion !== undefined) return;
      setMotionState(next);
      try {
        appLocalStorage.set(appLocalStorageKeys.motion, next);
      } catch {
        // Keep the live preference when storage is unavailable.
      }
    },
    [fixedSettings?.motion],
  );

  const setLinkUnderlines = useCallback(
    (next: AppLinkUnderlinePreference) => {
      if (fixedSettings?.linkUnderlines !== undefined) return;
      setLinkUnderlinesState(next);
      try {
        appLocalStorage.set(appLocalStorageKeys.linkUnderlines, next);
      } catch {
        // Keep the live preference when storage is unavailable.
      }
    },
    [fixedSettings?.linkUnderlines],
  );

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === appLocalStorageKeys.motion) {
        if (fixedSettings?.motion === undefined) {
          setMotionState(appLocalStorage.get(appLocalStorageKeys.motion) ?? themeSetup.defaultMotion);
        }
      }
      if (event.key === null || event.key === appLocalStorageKeys.linkUnderlines) {
        if (fixedSettings?.linkUnderlines === undefined) {
          setLinkUnderlinesState(
            appLocalStorage.get(appLocalStorageKeys.linkUnderlines) ?? themeSetup.defaultLinkUnderlines,
          );
        }
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fixedSettings?.linkUnderlines, fixedSettings?.motion]);

  const value = useMemo(
    () => ({
      linkUnderlines: fixedSettings?.linkUnderlines ?? linkUnderlines,
      motion: fixedSettings?.motion ?? motion,
      setLinkUnderlines,
      setMotion,
    }),
    [fixedSettings?.linkUnderlines, fixedSettings?.motion, linkUnderlines, motion, setLinkUnderlines, setMotion],
  );

  return (
    <AppAccessibilityPreferencesContext.Provider value={value}>{children}</AppAccessibilityPreferencesContext.Provider>
  );
}
