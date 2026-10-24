import { useContext, useLayoutEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router";

import { currentWindowScrollEntry, RouteScrollContext, routeScrollEntry } from "../routeScrollReadiness";

/** A leaf can defer its entry's existing scroll action until delayed content or a local error commits. */
export function useRouteScrollReady(ready: boolean): void {
  const context = useContext(RouteScrollContext);
  const location = useLocation();
  const owner = useRef({});
  const destination = useMemo(
    () =>
      routeScrollEntry({
        hash: location.hash,
        key: location.key,
        pathname: location.pathname,
        search: location.search,
      }),
    [location.hash, location.key, location.pathname, location.search],
  );

  useLayoutEffect(() => {
    const committed = window.navigation?.currentEntry?.key ? currentWindowScrollEntry(destination) : destination;
    if (committed.url !== destination.url) return;
    return context?.claimReady(committed.token, owner.current, ready);
  }, [context, destination, ready]);
}
