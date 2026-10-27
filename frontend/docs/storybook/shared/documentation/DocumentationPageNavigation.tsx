import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import { Box, Divider, Link, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { Link as RouterLink, useLocation } from "react-router";

import { useDevelopmentGuideTranslation } from "../../examples/shared/localization/useDevelopmentGuideTranslation";

import type {
  DocumentationNavigationGroup,
  DocumentationNavigationItem,
  DocumentationPageNavigationLabels,
} from "./DocumentationNavigation";
import { documentationNavigationItemMatchesPath } from "./documentationPathMatching";

function PageLink({
  direction,
  directionLabel,
  item,
  title,
}: Readonly<{
  direction: "next" | "previous";
  directionLabel: string;
  item: DocumentationNavigationItem;
  title: string;
}>) {
  const isNext = direction === "next";
  const icon: ReactNode = isNext ? <ArrowForwardOutlinedIcon /> : <ArrowBackOutlinedIcon />;

  return (
    <Link
      component={RouterLink}
      sx={{
        borderRadius: 1,
        color: "text.primary",
        display: "block",
        gridColumn: { sm: isNext ? 2 : 1, xs: 1 },
        minWidth: 0,
        p: 1.5,
        textDecoration: "none",
        "&:hover": {
          bgcolor: "rgo.hover",
          textDecoration: "none",
          "& [data-documentation-page-navigation-title]": {
            color: "primary.main",
          },
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "rgo.focus",
          outlineOffset: 2,
        },
      }}
      to={item.to}
      underline="none"
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: "center",
          justifyContent: isNext ? "flex-end" : "flex-start",
        }}
      >
        {!isNext ? icon : null}
        <Box sx={{ minWidth: 0, textAlign: isNext ? "right" : "left" }}>
          <Typography color="text.secondary" variant="caption">
            {directionLabel}
          </Typography>
          <Typography
            component="span"
            data-documentation-page-navigation-title
            sx={{
              display: "block",
              fontWeight: 600,
              lineHeight: 1.4,
              transition: theme =>
                theme.transitions.create("color", {
                  duration: theme.transitions.duration.shortest,
                }),
            }}
            variant="body2"
          >
            {title}
          </Typography>
        </Box>
        {isNext ? icon : null}
      </Stack>
    </Link>
  );
}

export function DocumentationPageNavigation({
  groups,
  labels,
}: Readonly<{
  groups: readonly DocumentationNavigationGroup[];
  labels: DocumentationPageNavigationLabels;
}>) {
  const { t } = useDevelopmentGuideTranslation();
  const { pathname } = useLocation();
  const items = groups.flatMap(group => group.items);
  const currentIndex = items.findIndex(item => documentationNavigationItemMatchesPath(item, pathname));

  if (currentIndex < 0) return null;

  const previous = items[currentIndex - 1];
  const next = items[currentIndex + 1];
  if (!previous && !next) return null;

  return (
    <Box aria-label={t(labels.labelKey)} component="nav" sx={{ mt: { sm: 8, xs: 6 }, width: "100%" }}>
      <Divider />
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))", xs: "1fr" },
          pt: 2,
        }}
      >
        {previous ? (
          <PageLink
            direction="previous"
            directionLabel={t(labels.previousKey)}
            item={previous}
            title={t(previous.labelKey)}
          />
        ) : null}
        {next ? (
          <PageLink direction="next" directionLabel={t(labels.nextKey)} item={next} title={t(next.labelKey)} />
        ) : null}
      </Box>
    </Box>
  );
}
