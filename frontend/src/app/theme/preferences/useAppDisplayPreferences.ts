import { useContext } from "react";

import { AppDisplayPreferencesContext, type AppDisplayPreferencesValue } from "./AppDisplayPreferencesContext";

export function useAppDisplayPreferences(): AppDisplayPreferencesValue {
  const value = useContext(AppDisplayPreferencesContext);

  if (!value) {
    throw new Error("useAppDisplayPreferences must be used inside AppDisplayPreferencesProvider");
  }

  return value;
}
