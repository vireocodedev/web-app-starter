import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { appShellConfig, type AppDrawerMode, type AppHeaderStickiness } from "../appShellConfig";
import type { AppFixedSettings } from "@/app/bootstrap/config/fixedSettings";
import {
  appLocalStorage,
  appLocalStorageKeys,
  clearObsoleteShellStorageKeys,
} from "@/app/data/storage/appLocalStorage";
import { AppShellPreferencesContext } from "./AppShellPreferencesContext";

/** Owns live, user-selectable shell preferences and their persistence. */
export function AppShellPreferencesProvider({
  children,
  fixedSettings,
  initialDrawerMode,
}: PropsWithChildren<{
  fixedSettings?: AppFixedSettings;
  initialDrawerMode?: AppDrawerMode;
}>) {
  const [drawerMode, setDrawerModeState] = useState<AppDrawerMode>(
    () =>
      fixedSettings?.drawerMode ??
      initialDrawerMode ??
      appLocalStorage.get(appLocalStorageKeys.drawerMode) ??
      appShellConfig.drawerMode,
  );
  const [headerStickiness, setHeaderStickinessState] = useState<AppHeaderStickiness>(
    () =>
      fixedSettings?.headerStickiness ??
      appLocalStorage.get(appLocalStorageKeys.headerStickiness) ??
      appShellConfig.headerStickiness,
  );
  const [permanentDrawerOpen, setPermanentDrawerOpenState] = useState(
    () => appLocalStorage.get(appLocalStorageKeys.permanentDrawerOpen) ?? appShellConfig.permanentDrawerOpen,
  );
  const [permanentDrawerCollapsed, setPermanentDrawerCollapsedState] = useState(
    () => appLocalStorage.get(appLocalStorageKeys.permanentDrawerCollapsed) ?? appShellConfig.permanentDrawerCollapsed,
  );

  useEffect(clearObsoleteShellStorageKeys, []);

  const setDrawerMode = useCallback(
    (next: AppDrawerMode) => {
      if (fixedSettings?.drawerMode !== undefined) return;
      setDrawerModeState(next);
      try {
        appLocalStorage.set(appLocalStorageKeys.drawerMode, next);
      } catch {
        // Keep the live preference when browser storage is unavailable.
      }
    },
    [fixedSettings?.drawerMode],
  );

  const setHeaderStickiness = useCallback(
    (next: AppHeaderStickiness) => {
      if (fixedSettings?.headerStickiness !== undefined) return;
      setHeaderStickinessState(next);
      try {
        appLocalStorage.set(appLocalStorageKeys.headerStickiness, next);
      } catch {
        // Keep the live preference when browser storage is unavailable.
      }
    },
    [fixedSettings?.headerStickiness],
  );

  const setPermanentDrawerOpen = useCallback((open: boolean) => {
    setPermanentDrawerOpenState(open);
    try {
      appLocalStorage.set(appLocalStorageKeys.permanentDrawerOpen, open);
    } catch {
      // Keep the live preference when browser storage is unavailable.
    }
  }, []);

  const setPermanentDrawerCollapsed = useCallback((collapsed: boolean) => {
    setPermanentDrawerCollapsedState(collapsed);
    try {
      appLocalStorage.set(appLocalStorageKeys.permanentDrawerCollapsed, collapsed);
    } catch {
      // Keep the live preference when browser storage is unavailable.
    }
  }, []);

  const value = useMemo(
    () => ({
      drawerMode,
      headerStickiness,
      permanentDrawerOpen,
      permanentDrawerCollapsed,
      setDrawerMode,
      setHeaderStickiness,
      setPermanentDrawerOpen,
      setPermanentDrawerCollapsed,
    }),
    [
      drawerMode,
      headerStickiness,
      permanentDrawerOpen,
      permanentDrawerCollapsed,
      setDrawerMode,
      setHeaderStickiness,
      setPermanentDrawerOpen,
      setPermanentDrawerCollapsed,
    ],
  );

  return <AppShellPreferencesContext.Provider value={value}>{children}</AppShellPreferencesContext.Provider>;
}
