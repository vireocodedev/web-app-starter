import { Box } from "@mui/material";
import { useMemo, useState, type ReactNode } from "react";

import {
  AppPageNavigation,
  type AppPageNavigationLabels,
  type AppPageNavigationLink,
} from "../components/AppPageNavigation";
import { DocumentationRailProvider } from "./DocumentationRailProvider";

export type DocumentationPageLayoutProps = Readonly<{
  links: readonly AppPageNavigationLink[];
  labels: AppPageNavigationLabels;
  children: ReactNode;
  pagination?: ReactNode;
}>;

/** Keeps article contents beneath the existing page navigation, on desktop and mobile. */
export function DocumentationPageLayout({ links, labels, children, pagination }: DocumentationPageLayoutProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [contentsTarget, setContentsTarget] = useState<HTMLElement | null>(null);
  const rail = useMemo(() => ({ contentsTarget }), [contentsTarget]);

  return (
    <Box ref={setContainer} sx={{ boxSizing: "border-box", containerType: "inline-size", minWidth: 0, width: "100%" }}>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          minWidth: 0,
          "@container (min-width: 900px)": {
            alignItems: "start",
            gap: 4,
            gridTemplateColumns: "240px minmax(0, 1fr)",
          },
        }}
      >
        <AppPageNavigation
          container={container}
          footer={
            <Box
              ref={setContentsTarget}
              sx={{
                borderTop: "1px solid",
                borderColor: "divider",
                mt: 3,
                pl: 2.25,
                pt: 3,
                "&:empty": { display: "none" },
              }}
            />
          }
          links={links}
          labels={labels}
        />
        <DocumentationRailProvider value={rail}>
          <Box sx={{ minWidth: 0, width: "100%" }}>
            {children}
            {pagination}
          </Box>
        </DocumentationRailProvider>
      </Box>
    </Box>
  );
}
