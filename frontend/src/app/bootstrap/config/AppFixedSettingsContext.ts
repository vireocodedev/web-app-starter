import { createContext } from "react";

import type { AppFixedSettings } from "./fixedSettings";

export const AppFixedSettingsContext = createContext<AppFixedSettings | null>(null);
