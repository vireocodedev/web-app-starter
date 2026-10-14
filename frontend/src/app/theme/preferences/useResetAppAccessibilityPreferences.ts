import { useCallback } from "react";

import { themeSetup } from "../themeSetup";
import { useAppAccessibilityPreferences } from "./useAppAccessibilityPreferences";

/** Restores configurable accessibility preferences through their owning setters. */
export function useResetAppAccessibilityPreferences(): () => void {
  const { setLinkUnderlines, setMotion } = useAppAccessibilityPreferences();

  return useCallback(() => {
    setMotion(themeSetup.defaultMotion);
    setLinkUnderlines(themeSetup.defaultLinkUnderlines);
  }, [setLinkUnderlines, setMotion]);
}
