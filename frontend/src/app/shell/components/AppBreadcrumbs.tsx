import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Breadcrumbs, Link, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Link as RouterLink, useMatches } from "react-router";

import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import type { AppRouteHandle } from "@/app/router/types/AppRoute";

const breadcrumbTextStyle = {
  fontSize: "1.0625rem",
  letterSpacing: "0.02em",
  lineHeight: 1.5,
} as const;

const mobileLocalBreadcrumbTextStyle = {
  display: { xs: "block", sm: "inline" },
  maxWidth: { xs: "min(29vw, 7rem)", sm: "none" },
  overflow: { xs: "hidden", sm: "visible" },
  textOverflow: { xs: "ellipsis", sm: "clip" },
  whiteSpace: { xs: "nowrap", sm: "normal" },
} as const;

/** Renders the current route's title and optional ancestor links. */
export function AppBreadcrumbs({
  latestOnly = false,
  local = false,
}: Readonly<{ latestOnly?: boolean; local?: boolean }>) {
  const { t } = useAppTranslation();
  const { t: guideT } = useDevelopmentGuideTranslation();
  const theme = useTheme();
  const compactLocalBreadcrumbs = useMediaQuery(theme.breakpoints.down("sm"));
  const matches = useMatches();
  const matchedRoute = [...matches].reverse().find(match => {
    const handle = match.handle as AppRouteHandle | undefined;
    return typeof handle?.resolveBreadcrumbs === "function";
  });
  const handle = matchedRoute?.handle as AppRouteHandle | undefined;
  const breadcrumbs = handle?.resolveBreadcrumbs({ app: t, developmentGuide: guideT }, matchedRoute?.params ?? {});

  if (!breadcrumbs?.length || (local && breadcrumbs.length < 3)) {
    return null;
  }
  const visibleBreadcrumbs = latestOnly ? breadcrumbs.slice(-1) : breadcrumbs;

  return (
    <Breadcrumbs
      aria-label={t("navigation.breadcrumbs")}
      maxItems={local && compactLocalBreadcrumbs ? 2 : visibleBreadcrumbs.length}
      separator={<NavigateNextIcon fontSize="small" />}
      sx={
        local
          ? {
              maxWidth: "100%",
              minWidth: 0,
              overflowX: { xs: "auto", sm: "visible" },
              "& .MuiBreadcrumbs-ol": { flexWrap: { xs: "nowrap", sm: "wrap" } },
              "& .MuiBreadcrumbs-separator": { flexShrink: 0, mx: { xs: 0.5, sm: 1 } },
            }
          : undefined
      }
    >
      {visibleBreadcrumbs.map((breadcrumb, index) => {
        const current = index === visibleBreadcrumbs.length - 1;

        if (current) {
          return (
            <Typography
              aria-current="page"
              component={local ? "span" : "h1"}
              key={`${breadcrumb.label}-${index}`}
              sx={{
                ...breadcrumbTextStyle,
                ...(local ? mobileLocalBreadcrumbTextStyle : {}),
                color: "text.primary",
              }}
            >
              {breadcrumb.label}
            </Typography>
          );
        }
        if (breadcrumb.to === undefined) {
          return (
            <Typography
              component="span"
              key={`${breadcrumb.label}-${index}`}
              sx={{
                ...breadcrumbTextStyle,
                ...(local ? mobileLocalBreadcrumbTextStyle : {}),
                color: "text.secondary",
              }}
            >
              {breadcrumb.label}
            </Typography>
          );
        }

        return (
          <Link
            color="inherit"
            component={RouterLink}
            key={`${breadcrumb.label}-${index}`}
            sx={{ ...breadcrumbTextStyle, ...(local ? mobileLocalBreadcrumbTextStyle : {}) }}
            to={breadcrumb.to}
            underline="hover"
          >
            {breadcrumb.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
