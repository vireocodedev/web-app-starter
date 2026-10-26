import { useCallback, useContext, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router";

import {
  currentWindowScrollEntry as windowEntry,
  RouteScrollContext,
  routeScrollEntry as routeEntry,
  type RouteScrollEntry as RouteEntry,
} from "../routeScrollReadiness";

type ScrollPosition = Readonly<{ left: number; top: number }>;

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
  const leafClaims = useRef(new Map<string, Map<object, Readonly<{ ready: boolean }>>>());
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
      // Preserve the saved target while delayed content can clamp the placeholder viewport.
      if (!entry || pending.current?.entry.token === entry.token) return;
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

  const entryReady = useCallback((token: string) => {
    if (readyToken.current !== token) return false;
    for (const claim of leafClaims.current.get(token)?.values() ?? []) {
      if (!claim.ready) return false;
    }
    return true;
  }, []);

  const applyPending = useCallback(
    (token: string) => {
      const action = pending.current;
      if (!action || action.entry.token !== token || currentEntry.current?.token !== token || !entryReady(token))
        return;
      if (scheduled.current?.token === token) return;
      cancelScheduled();
      const frame = window.requestAnimationFrame(() => {
        if (scheduled.current?.frame !== frame) return;
        scheduled.current = null;
        if (pending.current === action && currentEntry.current?.token === token && entryReady(token)) {
          // Consume only after both the current branch and all current leaf owners are still ready.
          pending.current = null;
          applyScroll(action);
        }
      });
      scheduled.current = { frame, token };
    },
    [cancelScheduled, entryReady],
  );

  const contentReady = useCallback(
    (token: string) => {
      readyToken.current = token;
      applyPending(token);
    },
    [applyPending],
  );

  const claimReady = useCallback(
    (token: string, owner: object, ready: boolean) => {
      const owners = leafClaims.current.get(token) ?? new Map<object, Readonly<{ ready: boolean }>>();
      const claim = { ready };
      owners.set(owner, claim);
      leafClaims.current.set(token, owners);
      if (!ready && scheduled.current?.token === token) cancelScheduled();
      if (ready) applyPending(token);
      return () => {
        // A stale cleanup cannot release a newer claim by this owner or another entry/owner.
        if (leafClaims.current.get(token)?.get(owner) !== claim) return;
        owners.delete(owner);
        if (!owners.size) leafClaims.current.delete(token);
        applyPending(token);
      };
    },
    [applyPending, cancelScheduled],
  );

  useLayoutEffect(() => {
    const entryClaims = leafClaims.current;
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
        // The new native hash entry still needs its React branch and leaf claims to commit.
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
      entryClaims.clear();
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
    const existingAction = pending.current;
    const retainedAction =
      existingAction?.entry.token === committedDestination.token
        ? existingAction
        : existingAction &&
            committedDestination.browserKey !== undefined &&
            existingAction.entry.browserKey === committedDestination.browserKey &&
            existingAction.entry.url === committedDestination.url
          ? { ...existingAction, entry: committedDestination }
          : null;
    pending.current =
      retainedAction ??
      (nativeHashNavigation
        ? null
        : pendingScroll(
            policyPrevious,
            committedDestination,
            navigationType,
            destinationIsUnambiguous ? positions.current.get(committedDestination.token) : undefined,
          ));

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

  const context = useMemo(() => ({ contentReady, claimReady }), [contentReady, claimReady]);
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
