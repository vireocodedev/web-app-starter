import { createContext } from "react";

import type { QueryClient } from "@tanstack/react-query";
import type { AppFeatures } from "./appFeatures";

export type AppRuntimeContextValue = Readonly<{
  features: AppFeatures;
  queryClient: QueryClient;
}>;

export const AppRuntimeContext = createContext<AppRuntimeContextValue | null>(null);
