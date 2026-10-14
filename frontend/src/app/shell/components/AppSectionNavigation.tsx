import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import {
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation } from "react-router";

import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { AppBottomDrawerHandle } from "@/app/overlays/components/AppBottomDrawerHandle";
import type { AppNavigationLink } from "@/app/router/types/AppRoute";
import { navigationPathMatchesLocation } from "./navigationPath";

/** Immediate route sections in the optional second header row. */
export function AppSectionNavigation({
  items,
  mobile,
}: Readonly<{ items: readonly AppNavigationLink[]; mobile: boolean }>) {
  const { t } = useAppTranslation();
  const { t: guideT } = useDevelopmentGuideTranslation();
  const { pathname } = useLocation();
  const containerRef = useRef<HTMLElement>(null);
  const drawerPaperRef = useRef<HTMLDivElement>(null);
  const measureRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const moreMeasureRef = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [menuState, setMenuState] = useState<{ mobile: boolean; anchor: HTMLElement | null }>({
    mobile,
    anchor: null,
  });
  if (menuState.mobile !== mobile) setMenuState({ mobile, anchor: null });
  const anchor = menuState.mobile === mobile ? menuState.anchor : null;
  const activeIndex = items.findIndex(item => navigationPathMatchesLocation(pathname, item.to, item.activePath));
  const label = (item: AppNavigationLink) =>
    item.labelNamespace === "development-guide" ? guideT(item.labelKey) : t(item.labelKey);

  useLayoutEffect(() => {
    if (mobile) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;
    const measure = () => {
      const available = container.clientWidth;
      const widths = items.map((_, index) => measureRefs.current[index]?.getBoundingClientRect().width ?? 0);
      const moreWidth = moreMeasureRef.current?.getBoundingClientRect().width ?? 0;
      const first = measureRefs.current[0]?.getBoundingClientRect();
      const second = measureRefs.current[1]?.getBoundingClientRect();
      const gap = first && second ? Math.max(0, second.left - first.right) : 0;
      const allWidth = widths.reduce((total, width) => total + width + gap, -gap);
      if (available <= 0 || widths.some(width => width <= 0)) {
        setVisibleCount(items.length);
        return;
      }
      if (allWidth <= available) {
        setVisibleCount(items.length);
        return;
      }
      let count = 0;
      for (let candidate = 1; candidate < items.length; candidate += 1) {
        const indices = Array.from({ length: candidate }, (_, index) => index);
        if (activeIndex >= candidate) indices[candidate - 1] = activeIndex;
        const used = indices.reduce((total, index) => total + widths[index]! + gap, moreWidth);
        if (used > available) break;
        count = candidate;
      }
      setVisibleCount(Math.max(1, count));
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    measureRefs.current.forEach(element => {
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [activeIndex, items, mobile]);

  const displayedCount = Math.min(visibleCount, items.length);
  const visibleIndices = mobile
    ? items.length > 0
      ? [0, activeIndex > 0 ? activeIndex : 1].filter(index => index < items.length)
      : []
    : Array.from({ length: displayedCount }, (_, index) => index);
  if (!mobile && activeIndex >= displayedCount && displayedCount > 0) {
    visibleIndices[displayedCount - 1] = activeIndex;
  }
  const overflowIndices = items.map((_, index) => index).filter(index => !visibleIndices.includes(index));
  const close = () => setMenuState({ mobile, anchor: null });
  const open = (event: MouseEvent<HTMLElement>) => setMenuState({ mobile, anchor: event.currentTarget });

  return (
    <Box
      aria-label={t("navigation.sections")}
      component="nav"
      data-rgo-section-navigation
      ref={containerRef}
      sx={{ containerType: mobile ? "inline-size" : undefined, flex: "1 1 auto", minWidth: 0, position: "relative" }}
    >
      <Stack direction="row" spacing={1} sx={{ height: "100%" }}>
        {visibleIndices.map(index => {
          const item = items[index]!;
          return (
            <Button
              aria-current={index === activeIndex ? "page" : undefined}
              component={Link}
              key={item.to}
              startIcon={<item.Icon fontSize="small" />}
              to={item.to}
              variant="text"
              sx={{
                borderRadius: 0,
                color: index === activeIndex ? "text.primary" : "text.secondary",
                flexShrink: mobile ? 1 : 0,
                fontWeight: index === activeIndex ? 700 : 500,
                minWidth: mobile ? 0 : undefined,
                overflow: mobile ? "hidden" : undefined,
                position: "relative",
                "& .MuiButton-startIcon": { flexShrink: 0 },
                ...(mobile && index !== activeIndex ? { "@container (max-width: 340px)": { display: "none" } } : {}),
                textTransform: "none",
                whiteSpace: "nowrap",
                ...(index === activeIndex
                  ? {
                      "&::after": {
                        bgcolor: "primary.main",
                        bottom: mobile ? 0 : -1,
                        content: '""',
                        height: 2,
                        left: 0,
                        position: "absolute",
                        right: 0,
                      },
                    }
                  : {}),
              }}
            >
              <Box
                component="span"
                sx={{
                  minWidth: 0,
                  overflow: mobile ? "hidden" : undefined,
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {label(item)}
              </Box>
            </Button>
          );
        })}
        {(mobile ? items.length > 1 : overflowIndices.length > 0) ? (
          <Button
            aria-expanded={anchor !== null}
            aria-haspopup={mobile ? "dialog" : "menu"}
            aria-label={mobile ? t("navigation.moreSections") : undefined}
            onClick={open}
            startIcon={<MoreHorizOutlinedIcon />}
            variant="text"
            sx={{
              color: "text.secondary",
              flexShrink: 0,
              minWidth: mobile ? 44 : undefined,
              textTransform: "none",
              "@container (max-width: 240px)": {
                "& .rgo-mobile-more-label": { display: "none" },
                "& .MuiButton-startIcon": { marginRight: 0 },
              },
            }}
          >
            <Box className="rgo-mobile-more-label" component="span">
              {mobile ? t("navigation.more") : t("navigation.moreNavigation")}
            </Box>
          </Button>
        ) : null}
      </Stack>
      <Stack
        aria-hidden="true"
        direction="row"
        spacing={1}
        sx={{ position: "absolute", right: 0, top: 0, visibility: "hidden", width: "max-content" }}
      >
        {items.map((item, index) => (
          <span
            key={item.to}
            ref={element => {
              measureRefs.current[index] = element;
            }}
          >
            <Button
              component="span"
              role="presentation"
              tabIndex={-1}
              startIcon={<item.Icon fontSize="small" />}
              sx={{
                borderRadius: 0,
                fontWeight: index === activeIndex ? 700 : 500,
                textTransform: "none",
                whiteSpace: "nowrap",
              }}
              variant="text"
            >
              {label(item)}
            </Button>
          </span>
        ))}
        <span ref={moreMeasureRef}>
          <Button
            component="span"
            role="presentation"
            tabIndex={-1}
            startIcon={<MoreHorizOutlinedIcon />}
            sx={{ color: "text.secondary", textTransform: "none" }}
            variant="text"
          >
            {mobile ? t("navigation.more") : t("navigation.moreNavigation")}
          </Button>
        </span>
      </Stack>
      <Menu
        anchorEl={mobile ? null : anchor}
        onClose={close}
        open={!mobile && anchor !== null}
        slotProps={{ list: { "aria-label": t("navigation.sections") } }}
      >
        {overflowIndices.map(index => {
          const item = items[index]!;
          return (
            <MenuItem
              aria-current={index === activeIndex ? "page" : undefined}
              component={Link}
              key={item.to}
              onClick={close}
              selected={index === activeIndex}
              to={item.to}
            >
              {label(item)}
            </MenuItem>
          );
        })}
      </Menu>
      <Drawer
        anchor="bottom"
        onClose={close}
        open={mobile && anchor !== null}
        slotProps={{
          paper: {
            "aria-label": t("navigation.sections"),
            "aria-modal": true,
            ref: drawerPaperRef,
            role: "dialog",
            sx: {
              backgroundImage: "none",
              bgcolor: "rgo.surfaceRaised",
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
              maxHeight: "min(70dvh, 600px)",
              overflow: "hidden",
            },
          },
        }}
      >
        <AppBottomDrawerHandle onDismiss={close} open={mobile && anchor !== null} paperRef={drawerPaperRef} />
        <Box
          sx={{
            minHeight: 0,
            overflowY: "auto",
            px: 2,
            pb: "max(16px, env(safe-area-inset-bottom))",
            pt: 0,
          }}
        >
          <Typography component="h2" sx={{ fontWeight: 700, mb: 1, px: 1 }} variant="subtitle1">
            {t("navigation.sections")}
          </Typography>
          <List aria-label={t("navigation.sections")} component="nav" disablePadding>
            {items.map((item, index) => (
              <ListItemButton
                aria-current={index === activeIndex ? "page" : undefined}
                component={Link}
                key={item.to}
                onClick={close}
                selected={index === activeIndex}
                to={item.to}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <item.Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={label(item)} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}
