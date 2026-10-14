import type { RgoOverlayBeforeClose } from "@rgo-web/frontend";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

export type AppOverlayViewSession<View> = Readonly<{ view: View; sessionId: number }>;

type AppMultiViewOverlayHandle<View, Patch extends object> = Readonly<{
  result: Promise<unknown>;
  updateView: (session: AppOverlayViewSession<View>) => void;
  updateProps: (patch: Partial<Patch>) => void;
}>;

type AppMultiViewOverlayControls<View, Patch extends object> = Readonly<{
  beforeClose: RgoOverlayBeforeClose;
  isCurrent: (sessionId: number) => boolean;
  show: (view: View) => Promise<boolean>;
  updateProps: (patch: Partial<Patch>) => void;
}>;

type AppMultiViewOverlayConfig<View, Patch extends object> = Readonly<{
  sameView: (current: View, next: View) => boolean;
  canLeave: (current: AppOverlayViewSession<View>, signal?: AbortSignal) => boolean | Promise<boolean>;
  mount: (
    session: AppOverlayViewSession<View>,
    controls: AppMultiViewOverlayControls<View, Patch>,
  ) => AppMultiViewOverlayHandle<View, Patch>;
}>;

/**
 * Coordinates views inside one mounted overlay while its feature supplies the leave policy.
 * Mount this hook inside a page-local RgoOverlayProvider that shares its lifetime:
 * provider teardown cancels the overlay when the controller unmounts.
 */
export function useAppMultiViewOverlay<View, Patch extends object>(config: AppMultiViewOverlayConfig<View, Patch>) {
  const configRef = useRef(config);
  const activeRef = useRef<Readonly<{
    session: AppOverlayViewSession<View>;
    handle: AppMultiViewOverlayHandle<View, Patch>;
    mountId: symbol;
  }> | null>(null);
  const nextSessionIdRef = useRef(0);
  const guardPendingRef = useRef(false);
  const guardAbortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const showRef = useRef<((view: View) => Promise<boolean>) | null>(null);

  // An event fired after a commit must use that render's feature callbacks.
  useLayoutEffect(() => {
    configRef.current = config;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      guardAbortRef.current?.abort();
      activeRef.current = null;
    };
  }, []);

  const isCurrent = useCallback((sessionId: number) => activeRef.current?.session.sessionId === sessionId, []);

  const updateProps = useCallback((patch: Partial<Patch>) => {
    activeRef.current?.handle.updateProps(patch);
  }, []);

  const canLeaveCurrent = useCallback(async (sessionId: number, externalSignal?: AbortSignal) => {
    const active = activeRef.current;
    if (!active || active.session.sessionId !== sessionId || guardPendingRef.current || externalSignal?.aborted) {
      return false;
    }

    guardPendingRef.current = true;
    const controller = new AbortController();
    guardAbortRef.current = controller;
    const abort = () => controller.abort();
    externalSignal?.addEventListener("abort", abort, { once: true });

    try {
      const approved = await configRef.current.canLeave(active.session, controller.signal);
      return Boolean(approved && !controller.signal.aborted && mountedRef.current && activeRef.current === active);
    } finally {
      externalSignal?.removeEventListener("abort", abort);
      if (guardAbortRef.current === controller) {
        guardAbortRef.current = null;
        guardPendingRef.current = false;
      }
    }
  }, []);

  const show = useCallback(
    async (view: View): Promise<boolean> => {
      const active = activeRef.current;
      if (active) {
        if (configRef.current.sameView(active.session.view, view)) return true;
        if (!(await canLeaveCurrent(active.session.sessionId))) return false;
        if (activeRef.current !== active) return false;

        const session = { view, sessionId: ++nextSessionIdRef.current };
        activeRef.current = { session, handle: active.handle, mountId: active.mountId };
        active.handle.updateView(session);
        return true;
      }

      if (!mountedRef.current || guardPendingRef.current) return false;
      const session = { view, sessionId: ++nextSessionIdRef.current };
      const mountId = Symbol("overlay mount");
      const beforeClose: RgoOverlayBeforeClose = ({ signal }) => {
        const active = activeRef.current;
        return active?.mountId === mountId ? canLeaveCurrent(active.session.sessionId, signal) : false;
      };
      const handle = configRef.current.mount(session, {
        beforeClose,
        isCurrent,
        show: nextView => showRef.current?.(nextView) ?? Promise.resolve(false),
        updateProps,
      });
      activeRef.current = { session, handle, mountId };
      const clear = () => {
        if (activeRef.current?.handle !== handle) return;
        guardAbortRef.current?.abort();
        guardAbortRef.current = null;
        guardPendingRef.current = false;
        activeRef.current = null;
      };
      void handle.result.then(clear, clear);
      return true;
    },
    [canLeaveCurrent, isCurrent, updateProps],
  );

  useLayoutEffect(() => {
    showRef.current = show;
  }, [show]);

  return { show, isCurrent, updateProps };
}
