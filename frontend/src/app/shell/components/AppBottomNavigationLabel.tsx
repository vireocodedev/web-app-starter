import { Box } from "@mui/material";
import { useLayoutEffect, useRef, useState } from "react";

/** Fits shortcut text without letting its height move the icon above it. */
export function AppBottomNavigationLabel({ label }: Readonly<{ label: string }>) {
  const slotRef = useRef<HTMLSpanElement>(null);
  const measurementRef = useRef<HTMLSpanElement>(null);
  const [fit, setFit] = useState<{ fontSize: number; lines: number }>();

  useLayoutEffect(() => {
    const slot = slotRef.current;
    const measurement = measurementRef.current;
    if (!slot || !measurement) return;
    let active = true;

    const refit = () => {
      if (!active) return;
      const availableWidth = slot.getBoundingClientRect().width;
      const textWidth = measurement.getBoundingClientRect().width;
      if (availableWidth <= 0 || textWidth <= 0) return;
      const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const baseline = rootFontSize * 0.7;
      // The baseline wins when a browser uses an unusually small default font.
      const minimum = Math.min(baseline, Math.max(11, rootFontSize * 0.6));
      const requiredSize = (baseline * availableWidth) / textWidth;
      const fontSize = Math.max(minimum, Math.min(baseline, requiredSize));
      const lines = requiredSize < minimum ? 2 : 1;
      setFit(current => (current?.fontSize === fontSize && current.lines === lines ? current : { fontSize, lines }));
    };

    // The probe stays at the baseline size: fitting cannot change its metrics
    // and therefore cannot feed its own measurements back into the observer.
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(refit);
    observer?.observe(slot);
    observer?.observe(measurement);
    window.addEventListener("resize", refit);
    const fonts = document.fonts;
    fonts?.addEventListener("loadingdone", refit);
    void fonts?.ready.then(refit);
    refit();

    return () => {
      active = false;
      observer?.disconnect();
      window.removeEventListener("resize", refit);
      fonts?.removeEventListener("loadingdone", refit);
    };
  }, [label]);

  return (
    <Box
      component="span"
      data-rgo-bottom-navigation-label
      ref={slotRef}
      sx={{
        display: "block",
        minWidth: 0,
        overflow: "hidden",
        position: "relative",
        textAlign: "center",
        width: "100%",
      }}
    >
      <Box
        aria-hidden="true"
        component="span"
        data-rgo-bottom-navigation-label-measurement
        ref={measurementRef}
        sx={{
          fontSize: "0.7rem",
          left: 0,
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          visibility: "hidden",
          whiteSpace: "nowrap",
          width: "max-content",
        }}
      >
        {label}
      </Box>
      <Box
        component="span"
        data-rgo-bottom-navigation-label-text
        data-rgo-label-lines={fit?.lines ?? 2}
        style={{ fontSize: fit ? String(fit.fontSize) + "px" : undefined }}
        sx={{
          display: "-webkit-box",
          fontSize: "0.7rem",
          lineHeight: 1.2,
          maxHeight: 29,
          overflow: "hidden",
          overflowWrap: "anywhere",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: fit?.lines ?? 2,
          whiteSpace: fit?.lines === 1 ? "nowrap" : "normal",
        }}
      >
        {label}
      </Box>
    </Box>
  );
}
