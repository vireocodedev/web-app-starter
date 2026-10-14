import { useCallback } from "react";

import { appShellConfig } from "../appShellConfig";
import { useAppShellPreferences } from "./useAppShellPreferences";

/** Restores every shell-owned preference to its configured application default. */
export function useResetAppShellPreferences(): () => void {
  const { setDrawerMode, setHeaderStickiness, setPermanentDrawerOpen, setPermanentDrawerCollapsed } =
    useAppShellPreferences();

  return useCallback(() => {
    setDrawerMode(appShellConfig.drawerMode);
    setHeaderStickiness(appShellConfig.headerStickiness);
    setPermanentDrawerOpen(appShellConfig.permanentDrawerOpen);
    setPermanentDrawerCollapsed(appShellConfig.permanentDrawerCollapsed);
  }, [setDrawerMode, setHeaderStickiness, setPermanentDrawerOpen, setPermanentDrawerCollapsed]);
}
