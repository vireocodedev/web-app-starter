import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { Outlet, useLocation, useNavigationType, type Location } from "react-router";

type ScrollPosition = Readonly<{ left: number; top: number }>;

type RouteEntry = Readonly<{
  hash: string;
  key: string;
  pathname: string;
  routerKey: string;
  search: string;
  token: string;
  url: string;
}>;

type PendingScroll = Readonly<{
  entry: RouteEntry;
  kind: "fragment" | "position" | "top";
  position?: ScrollPosition;
  topFallback: boolean;
}>;

type ProvisionalEntryAdvance = Readonly<{
  from: RouteEntry;
  to: RouteEntry;
}>;

type RouteScrollContextValue = Readonly<{
  contentReady: (token: string) => void;
}>;

const RouteScrollContext = createContext<RouteScrollContextValue | null>(null);

function routeEntry(location: Pick<Location, "hash" | "key" | "pathname" | "search">) {
  const url = `${location.pathname}${location.search}${location.hash}`;
  const routerKey = location.key || "default";
  const browserKey = window.navigation?.currentEntry?.key;
  const key = browserKey ? `${routerKey}\u0000${browserKey}` : routerKey;
  return {
    hash: location.hash,
    key,
    pathname: location.pathname,
    routerKey,
    search: location.search,
    token: `${key}\u0000${url}`,
    url,
  } satisfies RouteEntry;
}

function windowEntry(current: RouteEntry): RouteEntry {
  return routeEntry({
    hash: window.location.hash,
    key: current.routerKey,
    pathname: window.location.pathname,
    search: window.location.search,
  });
}

function decodedFragment(hash: string): string | null {
  if (!hash || hash === "#") return null;
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return null;
  }
}

function pendingScroll(
  current: RouteEntry | null,
  destination: RouteEntry,
  navigationType: ReturnType<typeof useNavigationType>,
  savedPosition: ScrollPosition | undefined,
): PendingScroll | null {
  if (current?.token === destination.token) return null;
  if (navigationType === "POP" && savedPosition) {
    return {
      entry: destination,
      kind: "position",
      position: savedPosition,
      topFallback: false,
    };
  }

  if (!current) {
    return destination.hash
      ? {
          entry: destination,
          kind: "fragment",
          topFallback: false,
        }
      : null;
  }

  const pathnameChanged = current.pathname !== destination.pathname;
  const queryOnlyUpdate =
    !pathnameChanged && current.hash === destination.hash && current.search !== destination.search;

  if (queryOnlyUpdate) return null;
  if (destination.hash && (pathnameChanged || current.hash !== destination.hash)) {
    return {
      entry: destination,
      kind: "fragment",
      topFallback: pathnameChanged,
    };
  }
  if (pathnameChanged) {
    return { entry: destination, kind: "top", topFallback: false };
  }
  return null;
}

function applyScroll(action: PendingScroll) {
  if (action.kind === "position" && action.position) {
    window.scrollTo({
      behavior: "auto",
      left: action.position.left,
      top: action.position.top,
    });
    return;
  }
  if (action.kind === "top") {
    window.scrollTo({ behavior: "auto", left: 0, top: 0 });
    return;
  }

  const fragment = decodedFragment(action.entry.hash);
  const target = fragment ? document.getElementById(fragment) : null;
  if (target) {
    target.scrollIntoView({ behavior: "auto", block: "start" });
  } else if (action.topFallback) {
    window.scrollTo({ behavior: "auto", left: 0, top: 0 });
  }
}

/** Owns window-scroll policy for the lifetime of the application router. */
export function RouteScrollRestoration({ children }: Readonly<{ children: ReactNode }>) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const destination = useMemo(
    () =>
      routeEntry({
        hash: location.hash,
        key: location.key,
        pathname: location.pathname,
        search: location.search,
      }),
    [location.hash, location.key, location.pathname, location.search],
  );
  const currentEntry = useRef<RouteEntry | null>(null);
  const pending = useRef<PendingScroll | null>(null);
  const readyToken = useRef<string | null>(null);
  const scheduled = useRef<Readonly<{ frame: number; token: string }> | null>(null);
  const frozenEntryToken = useRef<string | null>(null);
  const thawFrame = useRef<number | null>(null);
  const provisionalEntryAdvance = useRef<ProvisionalEntryAdvance | null>(null);
  const positions = useRef(new Map<string, ScrollPosition>());
  const knownUrls = useRef(new Map<string, string>());
  const ambiguousKeys = useRef(new Set<string>());
  const browserScrollRestoration = useRef<History["scrollRestoration"]>("auto");

  const observeEntry = useCallback((entry: RouteEntry) => {
    const knownUrl = knownUrls.current.get(entry.key);
    if (knownUrl !== undefined && knownUrl !== entry.url) {
      ambiguousKeys.current.add(entry.key);
      const tokenPrefix = `${entry.key}\u0000`;
      for (const token of positions.current.keys()) {
        if (token.startsWith(tokenPrefix)) {
          positions.current.delete(token);
        }
      }
      window.history.scrollRestoration = browserScrollRestoration.current;
      return false;
    }
    knownUrls.current.set(entry.key, entry.url);
    return !ambiguousKeys.current.has(entry.key);
  }, []);

  const savePosition = useCallback(
    (entry: RouteEntry | null) => {
      if (!entry) return;
      const position = {
        left: window.scrollX,
        top: window.scrollY,
      };
      if (observeEntry(entry)) positions.current.set(entry.token, position);
    },
    [observeEntry],
  );

  const cancelScheduled = useCallback(() => {
    if (!scheduled.current) return;
    window.cancelAnimationFrame(scheduled.current.frame);
    scheduled.current = null;
  }, []);

  const freezeCurrentPosition = useCallback(() => {
    const entry = currentEntry.current;
    savePosition(entry);
    if (!entry) return;
    frozenEntryToken.current = entry.token;
    if (thawFrame.current !== null) window.cancelAnimationFrame(thawFrame.current);
    thawFrame.current = window.requestAnimationFrame(() => {
      thawFrame.current = null;
      if (currentEntry.current?.token === entry.token) {
        const browserEntry = windowEntry(entry);
        if (browserEntry.url === entry.url) {
          savePosition(entry);
          frozenEntryToken.current = null;
        }
      }
    });
  }, [savePosition]);

  const applyPending = useCallback(
    (token: string) => {
      const action = pending.current;
      if (!action || action.entry.token !== token) return;
      pending.current = null;
      cancelScheduled();
      const frame = window.requestAnimationFrame(() => {
        scheduled.current = null;
        if (currentEntry.current?.token === token && readyToken.current === token) {
          applyScroll(action);
        }
      });
      scheduled.current = { frame, token };
    },
    [cancelScheduled],
  );

  const contentReady = useCallback(
    (token: string) => {
      readyToken.current = token;
      applyPending(token);
    },
    [applyPending],
  );

  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    browserScrollRestoration.current = previousScrollRestoration;
    window.history.scrollRestoration = "manual";

    const handleHashChange = () => {
      const current = currentEntry.current;
      if (current) observeEntry(windowEntry(current));
    };
    const handleCurrentEntryChange = (event: NavigationCurrentEntryChangeEvent) => {
      const previous = currentEntry.current;
      if (!previous) return;
      const next = windowEntry(previous);
      const nativeHashNavigation =
        previous.routerKey === next.routerKey &&
        previous.pathname === next.pathname &&
        previous.search === next.search &&
        previous.hash !== next.hash;
      if (!nativeHashNavigation) return;
      cancelScheduled();
      pending.current = null;
      readyToken.current = null;
      if (event.navigationType === "traverse") {
        const position = positions.current.get(next.token);
        if (!position) return;
        provisionalEntryAdvance.current = null;
        currentEntry.current = next;
        frozenEntryToken.current = null;
        window.history.scrollRestoration = observeEntry(next) ? "manual" : browserScrollRestoration.current;
        pending.current = {
          entry: next,
          kind: "position",
          position,
          topFallback: false,
        };
        readyToken.current = next.token;
        applyPending(next.token);
        return;
      }
      provisionalEntryAdvance.current = { from: previous, to: next };
      currentEntry.current = next;
      frozenEntryToken.current = null;
      window.history.scrollRestoration = observeEntry(next) ? "manual" : browserScrollRestoration.current;
    };
    const handleNavigationIntent = () => freezeCurrentPosition();
    const handleScroll = () => {
      if (frozenEntryToken.current !== currentEntry.current?.token) {
        savePosition(currentEntry.current);
      }
    };
    const handlePageHide = () => {
      savePosition(currentEntry.current);
      cancelScheduled();
      if (thawFrame.current !== null) window.cancelAnimationFrame(thawFrame.current);
      thawFrame.current = null;
      frozenEntryToken.current = null;
      pending.current = null;
      readyToken.current = null;
      provisionalEntryAdvance.current = null;
      window.history.scrollRestoration = previousScrollRestoration;
    };
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.history.scrollRestoration = currentEntry.current
          ? ambiguousKeys.current.has(currentEntry.current.key)
            ? browserScrollRestoration.current
            : "manual"
          : "manual";
      }
    };

    document.addEventListener("click", handleNavigationIntent, true);
    document.addEventListener("submit", handleNavigationIntent, true);
    window.addEventListener("hashchange", handleHashChange);
    window.navigation?.addEventListener("currententrychange", handleCurrentEntryChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      document.removeEventListener("click", handleNavigationIntent, true);
      document.removeEventListener("submit", handleNavigationIntent, true);
      window.removeEventListener("hashchange", handleHashChange);
      window.navigation?.removeEventListener("currententrychange", handleCurrentEntryChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("scroll", handleScroll);
      cancelScheduled();
      if (thawFrame.current !== null) window.cancelAnimationFrame(thawFrame.current);
      thawFrame.current = null;
      frozenEntryToken.current = null;
      currentEntry.current = null;
      pending.current = null;
      readyToken.current = null;
      provisionalEntryAdvance.current = null;
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, [applyPending, cancelScheduled, freezeCurrentPosition, observeEntry, savePosition]);

  useLayoutEffect(() => {
    const committedDestination = window.navigation?.currentEntry?.key ? windowEntry(destination) : destination;
    if (committedDestination.url !== destination.url) return;

    const previous = currentEntry.current;
    const provisionalAdvance = provisionalEntryAdvance.current;
    const policyPrevious =
      provisionalAdvance?.to.url === committedDestination.url &&
      provisionalAdvance.to.routerKey !== committedDestination.routerKey
        ? provisionalAdvance.from
        : previous;
    provisionalEntryAdvance.current = null;
    const destinationIsUnambiguous = observeEntry(committedDestination);
    const nativeHashNavigation =
      !window.navigation?.currentEntry?.key &&
      !destinationIsUnambiguous &&
      navigationType === "POP" &&
      policyPrevious?.routerKey === committedDestination.routerKey &&
      policyPrevious.pathname === committedDestination.pathname &&
      policyPrevious.search === committedDestination.search &&
      policyPrevious.hash !== committedDestination.hash;
    currentEntry.current = committedDestination;
    frozenEntryToken.current = null;
    window.history.scrollRestoration = destinationIsUnambiguous ? "manual" : browserScrollRestoration.current;
    pending.current = nativeHashNavigation
      ? null
      : pendingScroll(
          policyPrevious,
          committedDestination,
          navigationType,
          destinationIsUnambiguous ? positions.current.get(committedDestination.token) : undefined,
        );

    if (
      !pending.current &&
      policyPrevious?.token !== committedDestination.token &&
      policyPrevious?.pathname === committedDestination.pathname
    ) {
      savePosition(committedDestination);
    }

    if (readyToken.current === committedDestination.token) applyPending(committedDestination.token);

    return () => {
      if (scheduled.current?.token === committedDestination.token) cancelScheduled();
      if (pending.current?.entry.token === committedDestination.token) {
        pending.current = null;
      }
      if (readyToken.current === committedDestination.token) readyToken.current = null;
    };
  }, [applyPending, cancelScheduled, destination, navigationType, observeEntry, savePosition]);

  const context = useMemo(() => ({ contentReady }), [contentReady]);
  return <RouteScrollContext.Provider value={context}>{children}</RouteScrollContext.Provider>;
}

/** Signals that the active route branch has committed its destination content. */
export function RouteScrollContentReady() {
  const context = useContext(RouteScrollContext);
  const location = useLocation();
  const destination = useMemo(
    () =>
      routeEntry({
        hash: location.hash,
        key: location.key,
        pathname: location.pathname,
        search: location.search,
      }),
    [location.hash, location.key, location.pathname, location.search],
  );

  useLayoutEffect(() => {
    const committedDestination = window.navigation?.currentEntry?.key ? windowEntry(destination) : destination;
    if (committedDestination.url === destination.url) {
      context?.contentReady(committedDestination.token);
    }
  }, [context, destination]);
  if (!context) throw new Error("RouteScrollContentReady requires RouteScrollRestoration");
  return <Outlet />;
}
