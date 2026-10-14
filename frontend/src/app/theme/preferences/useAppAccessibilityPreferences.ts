import { useContext } from "react";

import {
  AppAccessibilityPreferencesContext,
  type AppAccessibilityPreferencesValue,
} from "./AppAccessibilityPreferencesContext";

export function useAppAccessibilityPreferences(): AppAccessibilityPreferencesValue {
  const value = useContext(AppAccessibilityPreferencesContext);

  if (!value) {
    throw new Error("useAppAccessibilityPreferences must be used inside AppAccessibilityPreferencesProvider");
  }

  return value;
}
