import { Box } from "@mui/material";
import { useCallback, useLayoutEffect, useRef, type PointerEvent, type RefObject } from "react";

type Drag = {
  handle: HTMLDivElement;
  paper: HTMLDivElement;
  pointerId: number;
  startY: number;
  startedAt: number;
  distance: number;
  transform: string;
  transition: string;
  appliedTransform: string;
};

/** Only the grip owns dragging; the drawer body retains native scrolling and its existing close lifecycle. */
export function AppBottomDrawerHandle({
  open,
  onDismiss,
  paperRef,
}: Readonly<{ open: boolean; onDismiss: () => void; paperRef: RefObject<HTMLDivElement | null> }>) {
  const dragRef = useRef<Drag | null>(null);

  const restore = useCallback(() => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    // A close transition may already have taken ownership of the same inline styles.
    if (drag.paper.style.transform === drag.appliedTransform) drag.paper.style.transform = drag.transform;
    if (drag.paper.style.transition === "none") drag.paper.style.transition = drag.transition;
    if (drag.handle.hasPointerCapture(drag.pointerId)) drag.handle.releasePointerCapture(drag.pointerId);
  }, []);

  useLayoutEffect(() => {
    if (!open) restore();
    window.addEventListener("resize", restore);
    return () => {
      window.removeEventListener("resize", restore);
      restore();
    };
  }, [open, restore]);

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    drag.distance = Math.max(0, event.clientY - drag.startY);
    drag.appliedTransform = `translateY(${drag.distance}px)`;
    drag.paper.style.transform = drag.appliedTransform;
  };

  return (
    <Box
      aria-hidden="true"
      data-rgo-bottom-drawer-handle
      onLostPointerCapture={(event: PointerEvent<HTMLDivElement>) => {
        if (dragRef.current?.pointerId === event.pointerId) restore();
      }}
      onPointerCancel={(event: PointerEvent<HTMLDivElement>) => {
        if (dragRef.current?.pointerId === event.pointerId) restore();
      }}
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
        const paper = paperRef.current;
        if (!open || !paper || !event.isPrimary || event.button !== 0 || dragRef.current) return;
        // Suppress compatibility mouse events from touch dragging a temporarily displaced paper.
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
          handle: event.currentTarget,
          paper,
          pointerId: event.pointerId,
          startY: event.clientY,
          startedAt: event.timeStamp,
          distance: 0,
          transform: paper.style.transform,
          transition: paper.style.transition,
          appliedTransform: paper.style.transform,
        };
        paper.style.transition = "none";
      }}
      onPointerMove={move}
      onPointerUp={(event: PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        move(event);
        const threshold = Math.max(56, Math.min(120, drag.paper.getBoundingClientRect().height * 0.18));
        const velocity = drag.distance / Math.max(1, event.timeStamp - drag.startedAt);
        const dismiss = drag.distance >= threshold || (drag.distance >= 24 && velocity >= 0.6);
        // Release the visual displacement before asking the owner's close path to run.
        restore();
        if (dismiss) onDismiss();
      }}
      sx={{
        alignItems: "center",
        cursor: "grab",
        display: "flex",
        flexShrink: 0,
        height: 32,
        justifyContent: "center",
        touchAction: "none",
        userSelect: "none",
        "&:active": { cursor: "grabbing" },
      }}
    >
      <Box sx={{ bgcolor: "rgo.textMuted", borderRadius: 2, height: 4, opacity: 0.5, width: 36 }} />
    </Box>
  );
}
