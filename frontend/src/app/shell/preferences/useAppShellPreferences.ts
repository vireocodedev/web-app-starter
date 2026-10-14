import { useContext } from "react";

import { AppShellPreferencesContext, type AppShellPreferencesValue } from "./AppShellPreferencesContext";

export function useAppShellPreferences(): AppShellPreferencesValue {
  const value = useContext(AppShellPreferencesContext);

  if (!value) {
    throw new Error("useAppShellPreferences must be used inside AppShellPreferencesProvider");
  }

  return value;
}
