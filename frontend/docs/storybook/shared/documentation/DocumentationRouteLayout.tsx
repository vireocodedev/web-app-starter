import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { Box, Button, Divider, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { Outlet, useLocation, useMatches } from "react-router";

import { useDevelopmentGuideTranslation } from "../../examples/shared/localization/useDevelopmentGuideTranslation";

import type { DocumentationNavigationGroup, DocumentationPageNavigationLabels } from "./DocumentationNavigation";
import { DocumentationNavigationTree } from "./DocumentationNavigationTree";
import { DocumentationPageNavigation } from "./DocumentationPageNavigation";
import { DocumentationRailProvider } from "./DocumentationRailProvider";

type DocumentationRouteHandle = Readonly<{
  documentationGroups?: readonly DocumentationNavigationGroup[];
}>;

function useDocumentationNavigationGroups() {
  const matches = useMatches();
  for (const match of matches) {
    const handle = match.handle as DocumentationRouteHandle | undefined;
    if (handle?.documentationGroups) return handle.documentationGroups;
  }
  return [];
}

/** Route-owned secondary navigation with a desktop rail and a narrow page-local menu. */
export function DocumentationRouteLayout({
  navigationLabelKey,
  pageNavigationLabels,
}: Readonly<{
  navigationLabelKey: DocumentationNavigationGroup["labelKey"];
  pageNavigationLabels: DocumentationPageNavigationLabels;
}>) {
  const { t } = useDevelopmentGuideTranslation();
  const { pathname } = useLocation();
  const groups = useDocumentationNavigationGroups();
  const [pageMenuState, setPageMenuState] = useState({ pathname, open: false });
  if (pageMenuState.pathname !== pathname) {
    setPageMenuState({ pathname, open: false });
  }
  const pageMenuOpen = pageMenuState.pathname === pathname && pageMenuState.open;
  const setPageMenuOpen = (open: boolean) => setPageMenuState({ pathname, open });
  const [desktopContentsTarget, setDesktopContentsTarget] = useState<HTMLElement | null>(null);
  const [mobileContentsTarget, setMobileContentsTarget] = useState<HTMLElement | null>(null);
  const contentsTarget = pageMenuOpen ? mobileContentsTarget : desktopContentsTarget;
  const contextValue = useMemo(() => ({ contentsTarget }), [contentsTarget]);

  return (
    <Box sx={{ containerType: "inline-size", py: { sm: 3, xs: 2 }, width: "100%" }}>
      <Box data-rgo-page-sidebar-trigger sx={{ mb: 2, "@container (min-width: 860px)": { display: "none" } }}>
        <Button
          aria-expanded={pageMenuOpen}
          aria-haspopup="dialog"
          onClick={() => setPageMenuOpen(true)}
          startIcon={<MenuBookOutlinedIcon />}
          variant="outlined"
        >
          {t("navigation.onThisPage")}
        </Button>
      </Box>
      <Box
        sx={{
          alignItems: "start",
          display: "grid",
          justifyContent: "center",
          rowGap: 3,
          "@container (min-width: 860px)": {
            columnGap: 4,
            gridTemplateColumns: "248px minmax(0, 1fr)",
            rowGap: 0,
          },
        }}
      >
        <Stack
          component="aside"
          data-documentation-rail
          data-examples-rail={navigationLabelKey === "navigation.examples" ? "" : undefined}
          divider={<Divider flexItem />}
          spacing={3}
          sx={{
            display: "none",
            minWidth: 0,
            width: "100%",
            "@container (min-width: 860px)": {
              alignSelf: "start",
              display: "flex",
              maxHeight: "calc(100dvh - var(--rgo-sticky-header-height) - 16px)",
              overflowX: "hidden",
              overflowY: "auto",
              position: "sticky",
              top: "calc(var(--rgo-sticky-header-height) + 16px)",
            },
          }}
        >
          <DocumentationNavigationTree groups={groups} navigationLabel={t(navigationLabelKey)} />
          <Box ref={setDesktopContentsTarget} sx={{ pl: "20px" }} />
        </Stack>
        <DocumentationRailProvider value={contextValue}>
          <Box sx={{ minWidth: 0, width: "100%" }}>
            <Outlet />
            <DocumentationPageNavigation groups={groups} labels={pageNavigationLabels} />
          </Box>
        </DocumentationRailProvider>
      </Box>
      <Drawer
        anchor="left"
        onClose={() => setPageMenuOpen(false)}
        open={pageMenuOpen}
        onClick={event => {
          if (event.target instanceof Element && event.target.closest("a[href]")) setPageMenuOpen(false);
        }}
        slotProps={{
          paper: {
            "aria-label": t("navigation.onThisPage"),
            sx: {
              bgcolor: "rgo.surface",
              boxSizing: "border-box",
              maxWidth: "100vw",
              p: 2,
              width: 320,
            },
          },
        }}
      >
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography sx={{ fontWeight: 700 }}>{t("navigation.onThisPage")}</Typography>
          <IconButton aria-label={t("navigation.closeNavigation")} onClick={() => setPageMenuOpen(false)}>
            <span aria-hidden="true">×</span>
          </IconButton>
        </Stack>
        <DocumentationNavigationTree groups={groups} navigationLabel={t(navigationLabelKey)} />
        <Box ref={setMobileContentsTarget} sx={{ mt: 2, pl: "20px" }} />
      </Drawer>
    </Box>
  );
}
