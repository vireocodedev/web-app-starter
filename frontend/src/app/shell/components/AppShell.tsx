import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import KeyboardDoubleArrowLeftOutlinedIcon from "@mui/icons-material/KeyboardDoubleArrowLeftOutlined";
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, Outlet, useLocation, useMatches, useNavigation } from "react-router";

import { useAppLocalization } from "@/app/localization/hooks/useAppLocalization";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import type { AppNavigationItem, AppNavigationLink, AppRouteHandle } from "@/app/router/types/AppRoute";
import type { AppFixedSettings } from "@/app/bootstrap/config/fixedSettings";
import { useAppColorScheme } from "@/app/theme/preferences/useAppColorScheme";

import { appShellConfig, type AppDrawerMode } from "../appShellConfig";
import { AppBottomNavigation, mobileBottomNavigationHeight } from "./AppBottomNavigation";
import { AppBreadcrumbs } from "./AppBreadcrumbs";
import { AppColorModeMenu } from "./AppColorModeMenu";
import { AppLocaleSelector } from "./AppLocaleSelector";
import { AppNavigation } from "./AppNavigation";
import { AppSectionNavigation } from "./AppSectionNavigation";
import { resolveAppColorMode } from "./appColorMode";
import { AppShellPreferencesProvider } from "../preferences/AppShellPreferencesProvider";
import { useAppShellPreferences } from "../preferences/useAppShellPreferences";

type AppShellProps = Readonly<{
  accountActions?: ReactNode;
  bottomNavigationItems?: readonly AppNavigationLink[];
  fixedSettings?: AppFixedSettings;
  headerActions?: ReactNode;
  initialDrawerMode?: AppDrawerMode;
  navigationItems: readonly AppNavigationItem[];
}>;

function Brand() {
  const { mode, systemMode } = useAppColorScheme();
  const activeMode = resolveAppColorMode(mode, systemMode);
  return (
    <Box
      alt="RGO"
      component="img"
      src={activeMode === "dark" ? "/brand/rgo-symbol-reverse.svg" : "/brand/rgo-symbol.svg"}
      sx={{ display: "block", height: 28, objectFit: "contain", width: 28 }}
    />
  );
}

function HeaderContext() {
  const { t } = useAppTranslation();
  const { t: guideT } = useDevelopmentGuideTranslation();
  const matches = useMatches();
  const location = useLocation();
  const topMatch = matches.find(match => {
    const handle = match.handle as AppRouteHandle | undefined;
    return typeof handle?.resolveTitle === "function";
  });
  const identityMatches = matches.filter(match => {
    const handle = match.handle as AppRouteHandle | undefined;
    return match === topMatch || handle?.headerBreadcrumb;
  });
  const contextMatch = [...matches].reverse().find(match => {
    const handle = match.handle as AppRouteHandle | undefined;
    return Boolean(handle?.HeaderContext);
  });
  const Context = (contextMatch?.handle as AppRouteHandle | undefined)?.HeaderContext;
  if (!topMatch) return null;

  return (
    <Stack
      aria-label={t("navigation.breadcrumbs")}
      data-rgo-header-context
      direction="row"
      sx={{ alignItems: "center", minWidth: 0, overflow: "hidden" }}
    >
      <Typography
        component="h1"
        sx={{
          alignItems: "center",
          color: "text.primary",
          display: "flex",
          fontSize: { xs: "0.875rem", sm: "0.9375rem" },
          fontWeight: 600,
          minWidth: 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {identityMatches.map((match, index) => {
          const handle = match.handle as AppRouteHandle;
          const title = handle.resolveTitle({ app: t, developmentGuide: guideT }, match.params);
          const isCurrent =
            identityMatches.length === 1 || match.pathname.replace(/\/$/, "") === location.pathname.replace(/\/$/, "");
          const labelStyle = {
            color: "inherit",
            flexShrink: identityMatches.length > 1 && index === identityMatches.length - 1 ? 0 : 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          } as const;
          return (
            <Fragment key={match.id}>
              {index > 0 ? (
                <ChevronRightOutlinedIcon aria-hidden="true" sx={{ flexShrink: 0, fontSize: 18, mx: 0.5 }} />
              ) : null}
              {isCurrent ? (
                <Box component="span" sx={labelStyle}>
                  {title}
                </Box>
              ) : (
                <Box
                  component={Link}
                  sx={{ ...labelStyle, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                  to={match.pathname}
                >
                  {title}
                </Box>
              )}
            </Fragment>
          );
        })}
      </Typography>
      {Context ? (
        <>
          <Typography aria-hidden="true" color="text.secondary" sx={{ mx: 1 }}>
            /
          </Typography>
          <Context params={contextMatch?.params ?? {}} />
        </>
      ) : null}
    </Stack>
  );
}

/** Full-width route-aware shell with a user-selected desktop drawer mode. */
export function AppShell({ fixedSettings, initialDrawerMode, ...props }: AppShellProps) {
  return (
    <AppShellPreferencesProvider fixedSettings={fixedSettings} initialDrawerMode={initialDrawerMode}>
      <AppShellContent fixedSettings={fixedSettings} {...props} />
    </AppShellPreferencesProvider>
  );
}

function AppShellContent({
  accountActions,
  bottomNavigationItems = [],
  fixedSettings,
  headerActions,
  navigationItems,
}: AppShellProps) {
  const { t } = useAppTranslation();
  const { locale, setLocale } = useAppLocalization();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const location = useLocation();
  const matches = useMatches();
  const routerNavigation = useNavigation();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const previousPathname = useRef(location.pathname);
  const {
    drawerMode,
    permanentDrawerCollapsed,
    permanentDrawerOpen,
    setPermanentDrawerCollapsed,
    setPermanentDrawerOpen,
    headerStickiness,
  } = useAppShellPreferences();
  const isTemporary = !desktop || drawerMode === "temporary";
  const [temporaryNavigationState, setTemporaryNavigationState] = useState({ desktop, isTemporary, open: false });
  if (temporaryNavigationState.desktop !== desktop || temporaryNavigationState.isTemporary !== isTemporary) {
    setTemporaryNavigationState({ desktop, isTemporary, open: false });
  }
  const temporaryOpen =
    temporaryNavigationState.desktop === desktop &&
    temporaryNavigationState.isTemporary === isTemporary &&
    temporaryNavigationState.open;
  const [suppressDrawerRestoreFocus, setSuppressDrawerRestoreFocus] = useState(false);
  const [sidebarTooltipActive, setSidebarTooltipActive] = useState(false);
  const [sidebarTooltipAnchor, setSidebarTooltipAnchor] = useState<HTMLSpanElement | null>(null);

  const matchedRoute = [...matches].reverse().find(match => match.handle);
  const routeHandle = matchedRoute?.handle as AppRouteHandle | undefined;
  const contentMaxWidth = [...matches]
    .reverse()
    .map(match => match.handle as AppRouteHandle | undefined)
    .find(handle => handle?.contentMaxWidth !== undefined)?.contentMaxWidth;
  const fixedContentWorkspace = routeHandle?.contentOverflow === "hidden";
  const deepestRouteHandle = matches.at(-1)?.handle as AppRouteHandle | undefined;
  const mobileBottomNavigation = deepestRouteHandle?.mobileBottomNavigation;
  const mobileSurface = deepestRouteHandle?.mobileSurface ?? "inset";
  const mainPaddingX = !desktop && mobileSurface === "flush" ? 0 : { sm: 3, xs: 2 };
  const showBottomNavigation = !desktop && mobileBottomNavigation !== false && bottomNavigationItems.length > 0;
  const groupHandle = matches
    .map(match => match.handle as AppRouteHandle | undefined)
    .find(handle => handle?.sectionNavigation?.length);
  const sectionNavigation = groupHandle?.sectionNavigation;
  const firstRowSticky = !desktop || headerStickiness !== "none";
  const secondRowSticky = desktop && headerStickiness === "both-rows";
  const stickyHeaderHeight = !desktop
    ? 56
    : headerStickiness === "both-rows" && sectionNavigation
      ? 112
      : headerStickiness === "none"
        ? 0
        : 64;
  const menuOpen = isTemporary ? temporaryOpen : permanentDrawerOpen;

  useEffect(() => {
    if (previousPathname.current !== location.pathname) {
      mainContentRef.current?.focus({ preventScroll: true });
      previousPathname.current = location.pathname;
      setTemporaryNavigationState({ desktop, isTemporary, open: false });
    }
  }, [desktop, isTemporary, location.pathname]);

  useEffect(() => {
    if (suppressDrawerRestoreFocus && !temporaryOpen) {
      mainContentRef.current?.focus({ preventScroll: true });
    }
  }, [suppressDrawerRestoreFocus, temporaryOpen]);

  const closeTemporaryNavigation = () => {
    setSuppressDrawerRestoreFocus(false);
    setTemporaryNavigationState({ desktop, isTemporary, open: false });
  };
  const closeTemporaryNavigationAfterNavigation = () => {
    setSuppressDrawerRestoreFocus(true);
    setTemporaryNavigationState({ desktop, isTemporary, open: false });
  };
  const toggleNavigation = () => {
    if (isTemporary) {
      setSuppressDrawerRestoreFocus(false);
      setTemporaryNavigationState(current => ({
        desktop,
        isTemporary,
        open: !(current.desktop === desktop && current.isTemporary === isTemporary && current.open),
      }));
    } else {
      setPermanentDrawerOpen(!permanentDrawerOpen);
    }
  };

  const desktopActions = (
    <Stack direction="row" sx={{ alignItems: "center", flexShrink: 0, gap: 0.25 }}>
      {fixedSettings?.theme === undefined ? <AppColorModeMenu /> : null}
      {fixedSettings?.locale === undefined ? (
        <AppLocaleSelector ariaLabel={t("locale.choose")} locale={locale} onLocaleChange={setLocale} />
      ) : null}
      {headerActions}
    </Stack>
  );

  const routeContent =
    contentMaxWidth === undefined ? (
      <>
        <AppBreadcrumbs local />
        <Outlet />
      </>
    ) : (
      <Container
        disableGutters
        maxWidth={contentMaxWidth}
        sx={{ display: "flex", flex: "1 1 auto", flexDirection: "column", minHeight: 0 }}
      >
        <AppBreadcrumbs local />
        <Outlet />
      </Container>
    );

  return (
    <Box
      sx={{
        "--rgo-sticky-header-height": String(stickyHeaderHeight) + "px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "row",
        height: fixedContentWorkspace
          ? showBottomNavigation
            ? "calc(100dvh - " + mobileBottomNavigationHeight + ")"
            : "100dvh"
          : "auto",
        minHeight: fixedContentWorkspace ? 0 : "100dvh",
        width: "100%",
        overflow: fixedContentWorkspace ? "hidden" : "visible",
        pb: showBottomNavigation && !fixedContentWorkspace ? mobileBottomNavigationHeight : 0,
      }}
    >
      <Button
        href="#main-content"
        sx={{
          clip: "rect(0 0 0 0)",
          clipPath: "inset(50%)",
          height: 1,
          left: 0,
          margin: -1,
          minWidth: 1,
          overflow: "hidden",
          p: 0,
          position: "fixed",
          top: 0,
          width: 1,
          zIndex: 1400,
          "&:focus, &:focus-visible": {
            bgcolor: "background.paper",
            boxShadow: 3,
            clip: "auto",
            clipPath: "none",
            height: "auto",
            left: 8,
            margin: 0,
            minWidth: 64,
            overflow: "visible",
            p: "6px 8px",
            top: 8,
            width: "auto",
          },
        }}
        variant="text"
      >
        {t("navigation.goToContent")}
      </Button>

      {desktop && drawerMode === "permanent" && permanentDrawerOpen ? (
        <Box
          aria-label={t("navigation.primary")}
          component="aside"
          data-rgo-navigation-collapsed={permanentDrawerCollapsed ? "true" : "false"}
          data-rgo-navigation-panel
          sx={{
            alignSelf: "flex-start",
            bgcolor: "rgo.shellSurface",
            borderRight: 1,
            borderColor: "divider",
            boxSizing: "border-box",
            display: "flex",
            flex: "0 0 auto",
            flexDirection: "column",
            height: "100dvh",
            overflowX: "hidden",
            overflowY: "hidden",
            py: "0.333rem",
            position: "sticky",
            top: 0,
            transition: theme =>
              theme.transitions.create("width", {
                duration: theme.transitions.duration.shorter,
              }),
            width: permanentDrawerCollapsed ? appShellConfig.collapsedDrawerWidth : appShellConfig.permanentDrawerWidth,
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          }}
        >
          <Box data-rgo-navigation-scroll-region sx={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>
            <AppNavigation collapsed={permanentDrawerCollapsed} navigationItems={navigationItems} variant="panel" />
          </Box>
          <Box
            component="footer"
            sx={{
              borderTop: 1,
              borderColor: "divider",
              flex: "0 0 auto",
              px: 3,
              py: 1.5,
            }}
          >
            <Tooltip
              disableFocusListener
              disableHoverListener
              disableInteractive
              disableTouchListener
              open={permanentDrawerCollapsed && sidebarTooltipActive}
              placement="right"
              slotProps={{
                popper: {
                  anchorEl: sidebarTooltipAnchor,
                  modifiers: [{ name: "offset", options: { offset: [0, 18] } }],
                },
              }}
              title={t("navigation.expandSidebar")}
            >
              <Button
                aria-expanded={!permanentDrawerCollapsed}
                aria-label={permanentDrawerCollapsed ? t("navigation.expandSidebar") : t("navigation.collapseSidebar")}
                data-rgo-sidebar-toggle
                fullWidth
                onBlur={() => setSidebarTooltipActive(false)}
                onClick={() => setPermanentDrawerCollapsed(!permanentDrawerCollapsed)}
                onFocus={() => setSidebarTooltipActive(true)}
                onMouseEnter={() => setSidebarTooltipActive(true)}
                onMouseLeave={() => setSidebarTooltipActive(false)}
                sx={{
                  borderRadius: 1,
                  color: "text.secondary",
                  justifyContent: "flex-start",
                  minHeight: 36,
                  minWidth: 0,
                  px: 1,
                  py: 0.625,
                  textTransform: "none",
                  "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "rgo.focus" },
                  "&:hover": { bgcolor: "rgo.hover" },
                }}
                variant="text"
              >
                <Box
                  component="span"
                  data-rgo-sidebar-toggle-icon
                  ref={setSidebarTooltipAnchor}
                  sx={{
                    display: "flex",
                    flex: "0 0 auto",
                    justifyContent: "center",
                    ml: 0.5,
                    width: 36,
                  }}
                >
                  <KeyboardDoubleArrowLeftOutlinedIcon
                    fontSize="small"
                    sx={{
                      transform: permanentDrawerCollapsed ? "rotate(180deg)" : "rotate(0deg)",
                      transition: theme =>
                        theme.transitions.create("transform", { duration: theme.transitions.duration.shorter }),
                      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
                    }}
                  />
                </Box>
                <Box
                  aria-hidden={permanentDrawerCollapsed}
                  component="span"
                  data-rgo-sidebar-toggle-label
                  sx={{
                    display: "block",
                    flex: "1 1 auto",
                    minWidth: 0,
                    opacity: permanentDrawerCollapsed ? 0 : 1,
                    overflow: "hidden",
                    textAlign: "left",
                    transition: theme =>
                      theme.transitions.create("opacity", { duration: theme.transitions.duration.shorter }),
                    whiteSpace: "nowrap",
                    "@media (prefers-reduced-motion: reduce)": { transition: "none" },
                  }}
                >
                  {t("navigation.collapseSidebar")}
                </Box>
              </Button>
            </Tooltip>
          </Box>
        </Box>
      ) : null}
      <Box
        data-rgo-shell-content-column
        sx={{
          display: "flex",
          flex: "1 1 auto",
          flexDirection: "column",
          minHeight: fixedContentWorkspace ? 0 : "100dvh",
          minWidth: 0,
        }}
      >
        <AppBar
          color="transparent"
          elevation={0}
          position={firstRowSticky ? "sticky" : "static"}
          sx={{
            bgcolor: "rgo.shellSurface",
            borderBottom: sectionNavigation ? 0 : 1,
            borderColor: "divider",
            color: "text.primary",
            flexShrink: 0,
            top: 0,
            zIndex: theme.zIndex.appBar + 1,
          }}
        >
          <Toolbar sx={{ gap: { xs: 0.5, sm: 1 }, minHeight: { xs: 56, md: 64 }, px: { xs: 1, sm: 2 } }}>
            <Tooltip title={t(menuOpen ? "navigation.closeMenuTooltip" : "navigation.openMenuTooltip")}>
              <IconButton
                aria-expanded={isTemporary ? temporaryOpen : undefined}
                aria-label={menuOpen ? t("navigation.closeNavigation") : t("navigation.menu")}
                color="inherit"
                onClick={toggleNavigation}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
            {desktop ? (
              <Tooltip title={t("navigation.goHome")}>
                <IconButton aria-label={t("navigation.goHome")} color="inherit" component={Link} to="/">
                  <Brand />
                </IconButton>
              </Tooltip>
            ) : null}
            <Box sx={{ flex: "1 1 auto", minWidth: 0, mx: { xs: 0, sm: 1 } }}>
              <HeaderContext />
            </Box>
            {desktop ? desktopActions : headerActions}
            {accountActions}
          </Toolbar>
          {routerNavigation.state !== "idle" ? (
            <LinearProgress
              aria-label={t("navigation.loading")}
              sx={{ bottom: -2, left: 0, position: "absolute", right: 0 }}
            />
          ) : null}
        </AppBar>

        {sectionNavigation ? (
          <Box
            data-rgo-header-second-row
            sx={{
              alignItems: "center",
              bgcolor: "rgo.shellSurface",
              borderBottom: 1,
              borderColor: "divider",
              boxSizing: "border-box",
              display: "flex",
              flexShrink: 0,
              height: 48,
              px: { xs: 1, sm: 2 },
              position: secondRowSticky ? "sticky" : "static",
              top: secondRowSticky ? 64 : undefined,
              zIndex: firstRowSticky ? theme.zIndex.appBar : undefined,
            }}
          >
            <AppSectionNavigation items={sectionNavigation} mobile={!desktop} />
          </Box>
        ) : null}

        {sectionNavigation && firstRowSticky && !secondRowSticky ? (
          <Box
            aria-hidden="true"
            data-rgo-header-divider
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              boxSizing: "border-box",
              flexShrink: 0,
              height: "1px",
              mt: "-1px",
              position: "sticky",
              top: desktop ? 64 : 56,
              // Row two covers this divider until it scrolls behind row one.
              zIndex: theme.zIndex.appBar - 1,
            }}
          />
        ) : null}

        <Box
          sx={{
            display: "flex",
            flex: fixedContentWorkspace ? "1 1 auto" : "1 0 auto",
            minHeight: fixedContentWorkspace ? 0 : "calc(100dvh - 112px)",
            width: "100%",
          }}
        >
          <Box
            component="main"
            id="main-content"
            ref={mainContentRef}
            tabIndex={-1}
            sx={{
              boxSizing: "border-box",
              display: "flex",
              flex: "1 1 auto",
              flexDirection: "column",
              minHeight: fixedContentWorkspace ? 0 : "auto",
              minWidth: 0,
              overflowY: fixedContentWorkspace ? "hidden" : "visible",
              px: mainPaddingX,
              py: { xs: 2, sm: 3 },
              // Keep route and skip-link focus without outlining the entire content region.
              "&:focus, &:focus-visible": { outline: "none" },
            }}
          >
            {routeContent}
          </Box>
        </Box>
        {showBottomNavigation ? <AppBottomNavigation items={bottomNavigationItems} /> : null}
        <Drawer
          anchor="left"
          ModalProps={{ disableRestoreFocus: suppressDrawerRestoreFocus }}
          onClose={closeTemporaryNavigation}
          open={isTemporary && temporaryOpen}
          slotProps={{
            paper: {
              "aria-label": t("navigation.primary"),
              sx: {
                bgcolor: "rgo.shellSurface",
                color: "text.primary",
                height: "100dvh",
                maxWidth: "min(320px, 100vw)",
                width: appShellConfig.permanentDrawerWidth,
              },
            },
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between", minHeight: 64 }}>
            <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
              <Brand />
              <Typography sx={{ fontWeight: 700 }}>RGO</Typography>
            </Stack>
            <IconButton aria-label={t("navigation.closeNavigation")} color="inherit" onClick={closeTemporaryNavigation}>
              <span aria-hidden="true">×</span>
            </IconButton>
          </Toolbar>
          <Divider />
          <Box data-rgo-navigation-scroll-region sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <AppNavigation
              navigationItems={navigationItems}
              onNavigate={closeTemporaryNavigationAfterNavigation}
              variant="drawer"
            />
          </Box>
        </Drawer>
      </Box>
    </Box>
  );
}
