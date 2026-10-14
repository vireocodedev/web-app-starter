import type { ThemeOptions } from "@mui/material/styles";

export const APPLICATION_TRANSITIONS = {
  duration: {
    complex: 240,
    enteringScreen: 240,
    leavingScreen: 180,
    short: 120,
    shorter: 120,
    shortest: 120,
    standard: 180,
  },
  easing: {
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
  },
} satisfies NonNullable<ThemeOptions["transitions"]>;

export const APPLICATION_MOTION = {
  reducedMotion: "system" as const,
} satisfies NonNullable<ThemeOptions["motion"]>;
