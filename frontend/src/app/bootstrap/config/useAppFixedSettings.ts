import { useContext } from "react";

import { AppFixedSettingsContext } from "./AppFixedSettingsContext";
import type { AppFixedSettings } from "./fixedSettings";

export function useAppFixedSettings(): AppFixedSettings {
  const value = useContext(AppFixedSettingsContext);

  if (!value) {
    throw new Error("useAppFixedSettings must be used inside AppFixedSettingsProvider");
  }

  return value;
}
