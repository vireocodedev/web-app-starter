import { BottomNavigation, BottomNavigationAction, Box } from "@mui/material";
import { Link, useLocation } from "react-router";

import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import type { AppNavigationLink } from "@/app/router/types/AppRoute";

import { navigationPathMatchesLocation } from "./navigationPath";
import { AppBottomNavigationLabel } from "./AppBottomNavigationLabel";

export const mobileBottomNavigationHeight = "calc(72px + env(safe-area-inset-bottom, 0px))";

/** Shows the application's primary mobile shortcuts without replacing the full drawer. */
export function AppBottomNavigation({ items }: Readonly<{ items: readonly AppNavigationLink[] }>) {
  const { t } = useAppTranslation();
  const { t: guideT } = useDevelopmentGuideTranslation();
  const { pathname } = useLocation();
  const activeIndex = items.findIndex(item => navigationPathMatchesLocation(pathname, item.to, item.activePath));

  return (
    <BottomNavigation
      aria-label={t("navigation.bottom")}
      component="nav"
      data-rgo-bottom-navigation
      showLabels
      sx={{
        bgcolor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
        bottom: 0,
        boxSizing: "border-box",
        height: mobileBottomNavigationHeight,
        left: 0,
        pb: "env(safe-area-inset-bottom, 0px)",
        position: "fixed",
        right: 0,
        zIndex: theme => theme.zIndex.appBar,
      }}
      value={activeIndex}
    >
      {items.map((item, index) => {
        const label = item.labelNamespace === "development-guide" ? guideT(item.labelKey) : t(item.labelKey);
        return (
          <BottomNavigationAction
            aria-current={index === activeIndex ? "page" : undefined}
            aria-label={label}
            component={Link}
            icon={
              <Box
                data-rgo-bottom-navigation-icon
                sx={{ alignItems: "center", display: "flex", flexShrink: 0, height: 30 }}
              >
                <item.Icon fontSize="small" />
              </Box>
            }
            key={item.to}
            label={<AppBottomNavigationLabel label={label} />}
            sx={{
              justifyContent: "flex-start",
              maxWidth: "none",
              minWidth: 0,
              px: 0.5,
              pt: "9px",
              pb: "1px",
              "& .MuiBottomNavigationAction-label, & .MuiBottomNavigationAction-label.Mui-selected": {
                alignItems: "center",
                display: "flex",
                flexShrink: 0,
                fontSize: "0.7rem",
                height: 29,
                lineHeight: 1.2,
                mt: "2px",
                textAlign: "center",
                width: "100%",
              },
            }}
            to={item.to}
            value={index}
          />
        );
      })}
    </BottomNavigation>
  );
}
