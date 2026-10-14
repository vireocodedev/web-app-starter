import type { PropsWithChildren } from "react";

import { AppRuntimeContext, type AppRuntimeContextValue } from "./AppRuntimeContext";

export type { AppRuntimeContextValue } from "./AppRuntimeContext";

export function AppRuntimeProvider({ children, runtime }: PropsWithChildren<{ runtime: AppRuntimeContextValue }>) {
  return <AppRuntimeContext.Provider value={runtime}>{children}</AppRuntimeContext.Provider>;
}
