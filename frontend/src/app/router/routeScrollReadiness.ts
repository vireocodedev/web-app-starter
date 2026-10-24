import { createContext } from "react";
import type { Location } from "react-router";

export type RouteScrollEntry = Readonly<{
  browserKey: string | undefined;
  hash: string;
  key: string;
  pathname: string;
  routerKey: string;
  search: string;
  token: string;
  url: string;
}>;

type RouteScrollContextValue = Readonly<{
  contentReady: (token: string) => void;
  claimReady: (token: string, owner: object, ready: boolean) => () => void;
}>;

export const RouteScrollContext = createContext<RouteScrollContextValue | null>(null);

export function routeScrollEntry(location: Pick<Location, "hash" | "key" | "pathname" | "search">) {
  const url = `${location.pathname}${location.search}${location.hash}`;
  const routerKey = location.key || "default";
  const browserKey = window.navigation?.currentEntry?.key;
  const key = browserKey ? `${routerKey}\u0000${browserKey}` : routerKey;
  return {
    browserKey,
    hash: location.hash,
    key,
    pathname: location.pathname,
    routerKey,
    search: location.search,
    token: `${key}\u0000${url}`,
    url,
  } satisfies RouteScrollEntry;
}

export function currentWindowScrollEntry(current: RouteScrollEntry): RouteScrollEntry {
  return routeScrollEntry({
    hash: window.location.hash,
    key: current.routerKey,
    pathname: window.location.pathname,
    search: window.location.search,
  });
}
