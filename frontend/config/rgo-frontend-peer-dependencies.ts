/**
 * Vite must resolve these peers from the consuming application, especially
 * while @rgo-web/frontend is installed as a local symlink for unpublished work.
 */
export const rgoFrontendPeerDependencies = [
  "@emotion/react",
  "@emotion/styled",
  "@mui/material",
  "@mui/x-date-pickers",
  "@tanstack/react-form",
  "axios",
  "dayjs",
  "react",
  "react-dom",
  "zod",
] as const;
