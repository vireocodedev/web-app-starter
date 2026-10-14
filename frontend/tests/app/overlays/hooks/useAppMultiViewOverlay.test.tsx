import { act, renderHook } from "@testing-library/react";
import type { RgoOverlayBeforeClose } from "@rgo-web/frontend";
import { describe, expect, it, vi } from "vitest";

import { useAppMultiViewOverlay, type AppOverlayViewSession } from "@/app/overlays/hooks/useAppMultiViewOverlay";

type View = string;
type Patch = { tag: string };
type Controls = {
  beforeClose: RgoOverlayBeforeClose;
  isCurrent: (sessionId: number) => boolean;
  show: (view: View) => Promise<boolean>;
  updateProps: (patch: Partial<Patch>) => void;
};

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

function setup(
  canLeave: (session: AppOverlayViewSession<View>, signal?: AbortSignal) => boolean | Promise<boolean> = () => true,
) {
  const mounts: Array<{
    session: AppOverlayViewSession<View>;
    controls: Controls;
    settle: () => void;
    updateView: ReturnType<typeof vi.fn<(session: AppOverlayViewSession<View>) => void>>;
    updateProps: ReturnType<typeof vi.fn<(patch: Partial<Patch>) => void>>;
  }> = [];
  const mount = vi.fn((session: AppOverlayViewSession<View>, controls: Controls) => {
    const result = deferred<void>();
    const updateView = vi.fn<(session: AppOverlayViewSession<View>) => void>();
    const updateProps = vi.fn<(patch: Partial<Patch>) => void>();
    mounts.push({ session, controls, settle: () => result.resolve(), updateView, updateProps });
    return { result: result.promise, updateView, updateProps };
  });
  const hook = renderHook(() =>
    useAppMultiViewOverlay<View, Patch>({
      sameView: (current, next) => current === next,
      canLeave,
      mount,
    }),
  );
  return { ...hook, mount, mounts };
}

function requestClose(controls: Controls, signal = new AbortController().signal) {
  return controls.beforeClose({ reason: "dismissed", signal });
}

describe("useAppMultiViewOverlay", () => {
  it("mounts immediately and treats a repeated view as a no-op", async () => {
    const { result, mount, mounts } = setup();
    let opening!: Promise<boolean>;

    act(() => {
      opening = result.current.show("filters");
      expect(mount).toHaveBeenCalledTimes(1);
    });

    expect(await opening).toBe(true);
    expect(mounts[0].session).toEqual({ view: "filters", sessionId: 1 });
    expect(await result.current.show("filters")).toBe(true);
    expect(mount).toHaveBeenCalledTimes(1);
    expect(mounts[0].updateView).not.toHaveBeenCalled();
  });

  it("keeps a declined view, then replaces it in the same mounted overlay after approval", async () => {
    const canLeave = vi.fn().mockResolvedValue(true).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const { result, mounts } = setup(canLeave);
    await result.current.show("create");

    expect(await result.current.show("filters")).toBe(false);
    expect(result.current.isCurrent(1)).toBe(true);
    expect(mounts[0].updateView).not.toHaveBeenCalled();

    expect(await result.current.show("filters")).toBe(true);
    expect(mounts).toHaveLength(1);
    expect(mounts[0].updateView).toHaveBeenCalledWith({ view: "filters", sessionId: 2 });
    expect(result.current.isCurrent(1)).toBe(false);
    expect(result.current.isCurrent(2)).toBe(true);
    expect(await requestClose(mounts[0].controls)).toBe(true);
    expect(canLeave).toHaveBeenLastCalledWith({ view: "filters", sessionId: 2 }, expect.any(AbortSignal));
  });

  it("serializes a pending switch with close and further switch requests", async () => {
    const approval = deferred<boolean>();
    const canLeave = vi.fn().mockReturnValueOnce(approval.promise);
    const { result, mounts } = setup(canLeave);
    await result.current.show("create");

    const switching = result.current.show("edit");
    expect(await requestClose(mounts[0].controls)).toBe(false);
    expect(await result.current.show("details")).toBe(false);
    expect(canLeave).toHaveBeenCalledTimes(1);
    approval.resolve(true);
    expect(await switching).toBe(true);
    expect(mounts[0].updateView).toHaveBeenCalledWith({ view: "edit", sessionId: 2 });
  });

  it("rejects a guard result after its signal aborts", async () => {
    const approval = deferred<boolean>();
    const { result, mounts } = setup(() => approval.promise);
    await result.current.show("create");
    const controller = new AbortController();

    const closing = requestClose(mounts[0].controls, controller.signal);
    controller.abort();
    approval.resolve(true);

    expect(await closing).toBe(false);
    expect(result.current.isCurrent(1)).toBe(true);
  });

  it("updates only the current handle and clears it when its result settles", async () => {
    const { result, mounts } = setup();
    await result.current.show("filters");
    result.current.updateProps({ tag: "first" });
    expect(mounts[0].updateProps).toHaveBeenCalledWith({ tag: "first" });

    await act(async () => {
      mounts[0].settle();
      await Promise.resolve();
    });
    expect(result.current.isCurrent(1)).toBe(false);
    result.current.updateProps({ tag: "ignored" });
    expect(mounts[0].updateProps).toHaveBeenCalledTimes(1);

    await result.current.show("create");
    expect(mounts).toHaveLength(2);
    expect(mounts[1].session.sessionId).toBe(2);
    expect(await requestClose(mounts[0].controls)).toBe(false);
    result.current.updateProps({ tag: "second" });
    expect(mounts[1].updateProps).toHaveBeenCalledWith({ tag: "second" });
  });

  it("aborts a pending leave guard when the mounted overlay settles", async () => {
    const approval = deferred<boolean>();
    let pendingSignal: AbortSignal | undefined;
    const { result, mounts } = setup((_session, signal) => {
      pendingSignal = signal;
      return approval.promise;
    });
    await result.current.show("create");

    const switching = result.current.show("filters");
    await act(async () => {
      mounts[0].settle();
      await Promise.resolve();
    });
    expect(pendingSignal?.aborted).toBe(true);
    expect(result.current.isCurrent(1)).toBe(false);
    expect(await result.current.show("details")).toBe(true);
    expect(mounts[1].session).toEqual({ view: "details", sessionId: 2 });

    approval.resolve(true);
    expect(await switching).toBe(false);
    expect(result.current.isCurrent(2)).toBe(true);
  });

  it("aborts a pending leave guard when its controller unmounts", async () => {
    const approval = deferred<boolean>();
    let pendingSignal: AbortSignal | undefined;
    const { result, mounts, unmount } = setup((_session, signal) => {
      pendingSignal = signal;
      return approval.promise;
    });
    await result.current.show("create");

    const switching = result.current.show("filters");
    unmount();
    expect(pendingSignal?.aborted).toBe(true);
    approval.resolve(true);
    expect(await switching).toBe(false);
    expect(mounts[0].updateView).not.toHaveBeenCalled();
  });

  it("uses the latest committed leave callback without changing controller methods", async () => {
    const firstLeave = vi.fn(() => false);
    const nextLeave = vi.fn(() => true);
    const mount = vi.fn(() => {
      const result = deferred<void>();
      return { result: result.promise, updateView: vi.fn(), updateProps: vi.fn() };
    });
    const { result, rerender } = renderHook(
      ({ canLeave }) =>
        useAppMultiViewOverlay<View, Patch>({
          sameView: (current, next) => current === next,
          canLeave,
          mount,
        }),
      { initialProps: { canLeave: firstLeave as (session: AppOverlayViewSession<View>) => boolean } },
    );
    const methods = result.current;
    await result.current.show("create");
    rerender({ canLeave: nextLeave });

    expect(result.current.show).toBe(methods.show);
    expect(result.current.isCurrent).toBe(methods.isCurrent);
    expect(await result.current.show("filters")).toBe(true);
    expect(firstLeave).not.toHaveBeenCalled();
    expect(nextLeave).toHaveBeenCalledOnce();
  });
});
