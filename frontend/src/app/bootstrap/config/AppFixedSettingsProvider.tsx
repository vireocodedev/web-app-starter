import type { PropsWithChildren } from "react";

import { AppFixedSettingsContext } from "./AppFixedSettingsContext";
import type { AppFixedSettings } from "./fixedSettings";

export function AppFixedSettingsProvider({
  children,
  fixedSettings,
}: PropsWithChildren<{ fixedSettings: AppFixedSettings }>) {
  return <AppFixedSettingsContext.Provider value={fixedSettings}>{children}</AppFixedSettingsContext.Provider>;
}
