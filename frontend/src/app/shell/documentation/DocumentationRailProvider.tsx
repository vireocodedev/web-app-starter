import type { PropsWithChildren } from "react";

import { DocumentationRailContext, type DocumentationRailContextValue } from "./documentationRail";

export function DocumentationRailProvider({
  children,
  value,
}: PropsWithChildren<{ value: DocumentationRailContextValue }>) {
  return <DocumentationRailContext.Provider value={value}>{children}</DocumentationRailContext.Provider>;
}
