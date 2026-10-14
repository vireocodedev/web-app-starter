import type { Shadows } from "@mui/material/styles";

const noElevation = "none";

/**
 * MUI requires exactly 25 elevation entries. Ordinary surfaces are flat;
 * overlays receive their colour-scheme-specific shadows from component
 * overrides instead of baking one mode's shadow into this shared tuple.
 */
export const APPLICATION_SHADOWS = [
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
  noElevation,
] satisfies Shadows;
