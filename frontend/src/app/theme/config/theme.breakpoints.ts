import type { ThemeOptions } from "@mui/material/styles";

export const APPLICATION_BREAKPOINTS = {
  values: {
    lg: 1200,
    md: 1024,
    sm: 600,
    xl: 1536,
    xs: 0,
  },
} satisfies NonNullable<ThemeOptions["breakpoints"]>;
