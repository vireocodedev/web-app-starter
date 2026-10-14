import { matchPath } from "react-router";

import type { DocumentationNavigationItem } from "./DocumentationNavigation";

export function documentationNavigationItemMatchesPath(item: DocumentationNavigationItem, pathname: string): boolean {
  if (item.activePath) {
    return matchPath({ end: true, path: item.activePath }, pathname) !== null;
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
