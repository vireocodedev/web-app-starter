import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppBottomDrawerHandle } from "@/app/overlays/components/AppBottomDrawerHandle";

function Harness({ open = true, onDismiss }: { open?: boolean; onDismiss: () => void }) {
  const paperRef = useRef<HTMLDivElement>(null);
  return (
    <div data-testid="paper" ref={paperRef} style={{ transform: "translateY(0px)", transition: "transform 225ms" }}>
      <AppBottomDrawerHandle onDismiss={onDismiss} open={open} paperRef={paperRef} />
      <div data-testid="body">Scrollable content</div>
    </div>
  );
}

function pointer(element: Element, type: string, y: number, timeStamp: number, pointerId = 1) {
  const event = new MouseEvent(type, { bubbles: true, button: 0, cancelable: true, clientY: y });
  Object.defineProperties(event, {
    isPrimary: { value: true },
    pointerId: { value: pointerId },
    // React falls back to Date.now() for a zero event timestamp; use a nonzero event clock.
    timeStamp: { value: timeStamp + 1_000 },
  });
  fireEvent(element, event);
  return event;
}

function setup(onDismiss = vi.fn()) {
  const rendered = render(<Harness onDismiss={onDismiss} />);
  const handle = document.querySelector<HTMLElement>("[data-rgo-bottom-drawer-handle]")!;
  const paper = screen.getByTestId("paper");
  const captured = new Set<number>();
  handle.setPointerCapture = vi.fn(id => captured.add(id));
  handle.hasPointerCapture = vi.fn(id => captured.has(id));
  handle.releasePointerCapture = vi.fn(id => captured.delete(id));
  vi.spyOn(paper, "getBoundingClientRect").mockReturnValue({ height: 600 } as DOMRect);
  return { ...rendered, handle, paper, onDismiss };
}

describe("AppBottomDrawerHandle", () => {
  beforeEach(() => vi.stubGlobal("PointerEvent", MouseEvent));
  afterEach(() => vi.unstubAllGlobals());

  it("restores the paper before requesting dismissal after a downward swipe", () => {
    const { handle, paper, onDismiss } = setup();
    onDismiss.mockImplementation(() => {
      expect(paper.style.transform).toBe("translateY(0px)");
      expect(paper.style.transition).toBe("transform 225ms");
    });
    expect(pointer(handle, "pointerdown", 100, 0).defaultPrevented).toBe(true);
    expect(pointer(handle, "pointermove", 240, 400).defaultPrevented).toBe(true);
    expect(paper.style.transform).toBe("translateY(140px)");
    expect(paper.style.transition).toBe("none");
    pointer(handle, "pointerup", 240, 500);
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(handle.releasePointerCapture).toHaveBeenCalledWith(1);
    expect(handle).toHaveAttribute("aria-hidden", "true");
    expect(handle).not.toHaveAttribute("tabindex");
  });

  it("accepts a fast short flick but restores slow short and upward gestures", () => {
    const { handle, paper, onDismiss } = setup();
    pointer(handle, "pointerdown", 100, 0);
    pointer(handle, "pointerup", 130, 500);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(paper.style.transform).toBe("translateY(0px)");
    pointer(handle, "pointerdown", 100, 600);
    pointer(handle, "pointerup", 70, 620);
    expect(onDismiss).not.toHaveBeenCalled();
    pointer(handle, "pointerdown", 100, 700);
    pointer(handle, "pointerup", 130, 730);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("ignores dragging in the body and movements from another pointer", () => {
    const { handle, paper, onDismiss } = setup();
    expect(pointer(screen.getByTestId("body"), "pointerdown", 100, 0).defaultPrevented).toBe(false);
    pointer(screen.getByTestId("body"), "pointerup", 300, 100);
    expect(onDismiss).not.toHaveBeenCalled();
    pointer(handle, "pointerdown", 100, 0);
    pointer(handle, "pointermove", 300, 100, 2);
    expect(paper.style.transform).toBe("translateY(0px)");
    pointer(handle, "pointercancel", 100, 150, 2);
    pointer(handle, "pointermove", 130, 180);
    expect(paper.style.transform).toBe("translateY(30px)");
    pointer(handle, "pointercancel", 100, 200);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("does not replace an exit transition that took ownership before external close cleanup", () => {
    const { handle, paper, onDismiss, rerender } = setup();
    pointer(handle, "pointerdown", 100, 0);
    pointer(handle, "pointermove", 220, 100);
    paper.style.transform = "translateY(600px)";
    paper.style.transition = "transform 195ms";
    rerender(<Harness onDismiss={onDismiss} open={false} />);
    expect(paper.style.transform).toBe("translateY(600px)");
    expect(paper.style.transition).toBe("transform 195ms");
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it.each(["pointercancel", "lostpointercapture", "resize", "close", "unmount"])(
    "cleans up a displaced paper on %s without dismissing",
    reason => {
      const { handle, paper, onDismiss, rerender, unmount } = setup();
      pointer(handle, "pointerdown", 100, 0);
      pointer(handle, "pointermove", 220, 100);
      if (reason === "resize") fireEvent(window, new Event("resize"));
      else if (reason === "close") rerender(<Harness onDismiss={onDismiss} open={false} />);
      else if (reason === "unmount") unmount();
      else pointer(handle, reason, 220, 200);
      expect(paper.style.transform).toBe("translateY(0px)");
      expect(paper.style.transition).toBe("transform 225ms");
      expect(onDismiss).not.toHaveBeenCalled();
      expect(handle.releasePointerCapture).toHaveBeenCalledWith(1);
    },
  );
});
