import { useRgoFeedback } from "@rgo-web/frontend";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useBlocker } from "react-router";

import type { DraftTranslate } from "./draftRequestModel";

type LeaveOptions = Readonly<{
  getCurrent: () => Readonly<{ dirty: boolean; busy: boolean }>;
  discard: () => void;
  onLogout: () => Promise<void>;
  onBusyLeave: () => void;
  t: DraftTranslate;
}>;

/** Consumer-owned recipe. Mount below a data router; the app has no installed logout guard registry. */
export function useDraftLeaveGuard(options: LeaveOptions) {
  const feedback = useRgoFeedback();
  const current = useRef(options);
  useLayoutEffect(() => {
    current.current = options;
  }, [options]);
  const prompt = useRef<AbortController | null>(null);
  const logoutPending = useRef(false);
  const logoutStarted = useRef(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const mayLeave = useCallback(
    async (owner: AbortController) => {
      const before = current.current.getCurrent();
      if (before.busy) {
        current.current.onBusyLeave();
        return false;
      }
      if (!before.dirty) return !owner.signal.aborted;
      const { t } = current.current;
      const result = await feedback.confirm({
        title: t("discardTitle"),
        message: t("discardMessage"),
        confirmLabel: t("discard"),
        cancelLabel: t("keep"),
        destructive: true,
        signal: owner.signal,
      });
      if (owner.signal.aborted) return false;
      const after = current.current.getCurrent();
      if (after.busy) {
        current.current.onBusyLeave();
        return false;
      }
      if (!after.dirty) return true;
      if (result.status !== "confirmed") return false;
      current.current.discard();
      return true;
    },
    [feedback],
  );

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    const { dirty, busy } = current.current.getCurrent();
    return (
      (dirty || busy) &&
      (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search)
    );
  });

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (prompt.current) {
      blocker.reset();
      return;
    }
    const owner = new AbortController();
    prompt.current = owner;
    void mayLeave(owner).then(allowed => {
      if (owner.signal.aborted || prompt.current !== owner) return;
      prompt.current = null;
      if (allowed) blocker.proceed();
      else blocker.reset();
    });
    return () => {
      owner.abort();
      if (prompt.current === owner) prompt.current = null;
    };
  }, [blocker, mayLeave]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      const { dirty, busy } = current.current.getCurrent();
      if (!dirty && !busy) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      prompt.current?.abort();
      prompt.current = null;
    };
  }, []);

  const requestLogout = useCallback(async () => {
    if (prompt.current || logoutPending.current) return;
    const owner = new AbortController();
    prompt.current = owner;
    logoutPending.current = true;
    try {
      if (!(await mayLeave(owner)) || owner.signal.aborted || current.current.getCurrent().busy) return;
      // Once the exit is accepted, prevent a fresh edit command while sign-out is pending.
      logoutStarted.current = true;
      setLoggingOut(true);
      await current.current.onLogout();
    } finally {
      if (prompt.current === owner) prompt.current = null;
      logoutPending.current = false;
      logoutStarted.current = false;
      if (!owner.signal.aborted) setLoggingOut(false);
    }
  }, [mayLeave]);

  return { requestLogout, loggingOut, isLoggingOut: () => logoutStarted.current };
}
