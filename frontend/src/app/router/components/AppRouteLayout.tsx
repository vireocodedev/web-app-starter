import { Outlet, useMatches } from "react-router";

import type { AppRouteHandle } from "../types/AppRoute";
import { RouteDocumentTitle } from "./RouteDocumentTitle";
import { RouteScrollRestoration } from "./RouteScrollRestoration";
import { RouteScrollToTop } from "./RouteScrollToTop";

/** Keeps route-level concerns active for both public and authenticated routes. */
export function AppRouteLayout() {
  const matches = useMatches();
  const matchedRoute = [...matches].reverse().find(match => match.handle);
  const handle = matchedRoute?.handle as AppRouteHandle | undefined;

  return (
    <RouteScrollRestoration>
      <RouteDocumentTitle />
      <Outlet />
      {handle?.scrollToTop ? <RouteScrollToTop /> : null}
    </RouteScrollRestoration>
  );
}
