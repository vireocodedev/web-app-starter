import { useCallback } from "react";

import { defaultAppLocale } from "../localeConfig";
import { useAppLocalization } from "./useAppLocalization";

/** Restores the active locale to the application's configured default. */
export function useResetAppLocale(): () => void {
  const { setLocale } = useAppLocalization();

  return useCallback(() => {
    setLocale(defaultAppLocale);
  }, [setLocale]);
}
