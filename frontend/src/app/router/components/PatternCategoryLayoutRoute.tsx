import { useMatches } from "react-router";

import { PatternCategoryLayout } from "@/pages/development-guide/patterns/PatternCategoryLayout";

import type { AppRouteHandle } from "../types/AppRoute";

/** Supplies the selected category's route-owned article navigation to its page. */
export function PatternCategoryLayoutRoute() {
  const matches = useMatches();
  const handle = [...matches]
    .reverse()
    .map(match => match.handle as AppRouteHandle | undefined)
    .find(candidate => candidate?.documentationGroups !== undefined);
  return <PatternCategoryLayout group={handle?.documentationGroups?.[0]} />;
}
