import { Box } from "@mui/material";
import type { ReactElement } from "react";

import { StorybookAddressBar } from "./StorybookAddressBar";

/** Shares the preview viewport between browser chrome and an ordinary-flow AppShell. */
export function StorybookBrowserFrame({ children }: Readonly<{ children: ReactElement }>) {
  return (
    <Box
      data-storybook-browser-frame
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        minWidth: 0,
        "& > [data-storybook-address-bar]": { flexShrink: 0 },
        // AppShell's full-window minimums must share space with the address bar here.
        "& > :not([data-storybook-address-bar])": { flex: "1 0 auto", minHeight: 0 },
        "& [data-rgo-shell-content-column]": { minHeight: 0 },
        "& [data-rgo-shell-content-column] > :has(> #main-content)": { minHeight: 0 },
      }}
    >
      <StorybookAddressBar />
      {children}
    </Box>
  );
}
