import { createContext } from "react";

import type { AppLinkUnderlinePreference, AppMotionPreference } from "../themeSetup";

export type AppAccessibilityPreferencesValue = Readonly<{
  linkUnderlines: AppLinkUnderlinePreference;
  motion: AppMotionPreference;
  setLinkUnderlines: (value: AppLinkUnderlinePreference) => void;
  setMotion: (value: AppMotionPreference) => void;
}>;

export const AppAccessibilityPreferencesContext = createContext<AppAccessibilityPreferencesValue | null>(null);
