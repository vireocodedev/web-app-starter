import { useContext } from "react";

import { AppLocalizationContext, type AppLocalizationContextValue } from "../contexts/AppLocalizationContext";

export function useAppLocalization(): AppLocalizationContextValue {
  const value = useContext(AppLocalizationContext);

  if (!value) {
    throw new Error("useAppLocalization must be used inside AppLocalizationProvider");
  }

  return value;
}
