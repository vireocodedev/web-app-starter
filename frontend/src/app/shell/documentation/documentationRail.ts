import { createContext, useContext } from "react";

export type DocumentationRailContextValue = Readonly<{
  contentsTarget: HTMLElement | null;
}>;

export const DocumentationRailContext = createContext<DocumentationRailContextValue | null>(null);

export function useDocumentationRail() {
  return useContext(DocumentationRailContext);
}
