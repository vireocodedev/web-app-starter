import { createContext } from "react";

import type { AppDrawerMode, AppHeaderStickiness } from "../appShellConfig";

export type AppShellPreferencesValue = Readonly<{
  drawerMode: AppDrawerMode;
  headerStickiness: AppHeaderStickiness;
  permanentDrawerOpen: boolean;
  permanentDrawerCollapsed: boolean;
  setDrawerMode: (mode: AppDrawerMode) => void;
  setHeaderStickiness: (stickiness: AppHeaderStickiness) => void;
  setPermanentDrawerOpen: (open: boolean) => void;
  setPermanentDrawerCollapsed: (collapsed: boolean) => void;
}>;

export const AppShellPreferencesContext = createContext<AppShellPreferencesValue | null>(null);
