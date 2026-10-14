import { documentationNavigationItemMatchesPath } from "@/app/shell/documentation";

import type { AppNavigationLink } from "../types/ExampleNavigation";

/** Matches example routes consistently across the tree and adjacent-page navigation. */
export function exampleNavigationItemMatchesPath(item: AppNavigationLink, pathname: string): boolean {
  return documentationNavigationItemMatchesPath(item, pathname);
}
