import type { SvgIconComponent } from "@mui/icons-material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link, matchPath, useLocation, useNavigate } from "react-router";

import { AppBottomDrawerHandle } from "@/app/overlays/components/AppBottomDrawerHandle";

export type AppPageNavigationLink = Readonly<{
  Icon: SvgIconComponent;
  label: string;
  to: string;
  activePath?: string;
}>;
export type AppPageNavigationLabels = Readonly<{
  navigation: string;
  pages: string;
  choosePage: (page: string) => string;
  close: string;
}>;
export type AppPageNavigationProps = Readonly<{
  container: HTMLElement | null;
  links: readonly AppPageNavigationLink[];
  labels: AppPageNavigationLabels;
  dataScope?: string;
  footer?: ReactNode;
}>;
type MenuState = Readonly<{
  pathname: string;
  phase: "closed" | "open" | "closing";
  destination?: string;
  fragment?: string;
  suppressRestoreFocus: boolean;
}>;

/** Page-owned navigation uses its content container, independently of shell breakpoints. */
export function AppPageNavigation({ container, links, labels, dataScope = "page", footer }: AppPageNavigationProps) {
  const navigationAttributes = { [`data-rgo-${dataScope}-navigation`]: true };
  const selectorAttribute = dataScope === "page" ? "data-rgo-page-selector" : `data-rgo-${dataScope}-page-selector`;
  const selectorAttributes = { [selectorAttribute]: true };
  const activeLineAttributes = { [`data-rgo-${dataScope}-active-line`]: true };
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const titleId = useId();
  const sheetId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerPaperRef = useRef<HTMLDivElement>(null);
  const completingRef = useRef(false);
  const [mobileFooter, setMobileFooter] = useState<HTMLElement | null>(null);
  const [desktop, setDesktop] = useState(false);
  const [menu, setMenu] = useState<MenuState>({ pathname, phase: "closed", suppressRestoreFocus: false });

  useEffect(() => {
    if (!container) return;
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(entries => {
      const entry = entries.find(item => item.target === container);
      if (entry) setDesktop(entry.contentRect.width >= 900);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [container]);

  // Close before descendant/parent navigation effects run, so the trap cannot reclaim main-content focus.
  if (menu.pathname !== pathname) {
    setMenu({ pathname, phase: menu.phase === "closed" ? "closed" : "closing", suppressRestoreFocus: true });
  } else if (desktop && menu.phase === "open") {
    setMenu({ pathname, phase: "closing", suppressRestoreFocus: false });
  }

  useEffect(() => {
    if (menu.phase !== "closed" || !completingRef.current) return;
    completingRef.current = false;
    // The Drawer has unmounted and released modal ownership. Restore a useful starting point before
    // asking the router to navigate; a successful pathname change then owns main-content focus.
    if (!menu.suppressRestoreFocus || menu.destination !== undefined || menu.fragment !== undefined) {
      triggerRef.current?.focus({ preventScroll: true });
    }
    if (menu.destination !== undefined) void navigate(menu.destination);
    if (menu.fragment !== undefined) {
      let id = menu.fragment;
      try {
        id = decodeURIComponent(id);
      } catch {
        // Malformed fragments still have their literal browser meaning.
      }
      if (id) document.getElementById(id)?.scrollIntoView({ behavior: "auto", block: "start" });
      else window.scrollTo({ behavior: "auto", left: 0, top: 0 });
    }
  }, [menu.destination, menu.fragment, menu.phase, menu.suppressRestoreFocus, navigate]);

  const hasFooter = footer !== undefined && footer !== null;
  useEffect(() => {
    if (!hasFooter || desktop || menu.phase !== "open" || !mobileFooter) return;
    // Footer content may arrive through a portal. Listen on the DOM sheet so those
    // fragment links also wait for modal ownership to be released before scrolling.
    const followFragment = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      const href = anchor?.getAttribute("href");
      if (
        !href?.startsWith("#") ||
        anchor?.getAttribute("target") === "_blank" ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      setMenu({
        pathname,
        phase: "closing",
        ...(hash === href ? { fragment: href.slice(1) } : { destination: `${pathname}${search}${href}` }),
        suppressRestoreFocus: true,
      });
    };
    mobileFooter.addEventListener("click", followFragment);
    return () => mobileFooter.removeEventListener("click", followFragment);
  }, [desktop, hasFooter, mobileFooter, menu.phase, pathname, search, hash]);

  const selectedLink = links.find(link => matchPath({ path: link.activePath ?? link.to, end: false }, pathname));
  const CurrentIcon = selectedLink?.Icon ?? MenuOutlinedIcon;
  const currentLabel = selectedLink?.label ?? labels.pages;
  const close = (destination?: string) => {
    setMenu({ pathname, phase: "closing", destination, suppressRestoreFocus: destination !== undefined });
  };

  const renderLinks = (sheet: boolean) =>
    links.map(({ Icon, label, to, activePath }) => {
      const selected = matchPath({ path: activePath ?? to, end: false }, pathname) !== null;
      return (
        <Box key={to} sx={{ pl: sheet ? 0 : 2.25, position: "relative" }}>
          {!sheet && selected ? (
            <Box
              aria-hidden="true"
              {...activeLineAttributes}
              sx={{
                bgcolor: "primary.main",
                borderRadius: 1,
                bottom: 6,
                left: 0,
                position: "absolute",
                top: 6,
                width: 3,
              }}
            />
          ) : null}
          <ListItemButton
            aria-current={selected ? "page" : undefined}
            component={Link}
            onClick={
              sheet
                ? event => {
                    if (
                      event.defaultPrevented ||
                      event.button !== 0 ||
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.altKey
                    )
                      return;
                    event.preventDefault();
                    // Choosing the current page dismisses without dropping its query parameters or fragment.
                    close(pathname === to ? undefined : to);
                  }
                : undefined
            }
            selected={selected}
            sx={{
              borderRadius: 1,
              color: "text.primary",
              minHeight: sheet ? 48 : 38,
              px: 1.25,
              py: sheet ? 1 : 0.5,
              "&.Mui-selected, &.Mui-selected:hover": { bgcolor: "rgo.navigationSelected" },
              "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "rgo.focus", outlineOffset: -2 },
            }}
            to={to}
          >
            <ListItemIcon sx={{ color: "text.secondary", minWidth: 32 }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={label}
              slotProps={{
                primary: { sx: { fontWeight: selected ? 700 : 400, overflowWrap: "anywhere", whiteSpace: "normal" } },
              }}
            />
          </ListItemButton>
        </Box>
      );
    });

  return (
    <>
      <Box sx={{ minWidth: 0, "@container (min-width: 900px)": { display: "none" } }}>
        <Button
          aria-controls={menu.phase === "open" ? sheetId : undefined}
          aria-expanded={menu.phase === "open"}
          aria-haspopup="dialog"
          aria-label={labels.choosePage(currentLabel)}
          {...selectorAttributes}
          endIcon={<ExpandMoreOutlinedIcon />}
          fullWidth
          onClick={() => setMenu({ pathname, phase: "open", suppressRestoreFocus: false })}
          ref={triggerRef}
          startIcon={<CurrentIcon />}
          sx={{
            color: "text.primary",
            justifyContent: "flex-start",
            minHeight: 48,
            textAlign: "left",
            "& .MuiButton-endIcon": { ml: "auto", pl: 1 },
          }}
          variant="outlined"
        >
          <Box component="span" sx={{ minWidth: 0, overflowWrap: "anywhere", whiteSpace: "normal" }}>
            {currentLabel}
          </Box>
        </Button>
      </Box>
      <Box
        component="aside"
        {...navigationAttributes}
        sx={{
          display: "none",
          minWidth: 0,
          "@container (min-width: 900px)": {
            alignSelf: "start",
            display: "block",
            maxHeight: "calc(100dvh - var(--rgo-sticky-header-height) - 24px)",
            overflowY: "auto",
            position: "sticky",
            top: "calc(var(--rgo-sticky-header-height) + 24px)",
          },
        }}
      >
        <Box aria-label={labels.navigation} component="nav">
          {renderLinks(false)}
        </Box>
        {desktop ? footer : null}
      </Box>
      {/* Keep Drawer mounted so its first opening uses the same Slide entrance as shell section navigation. */}
      <Drawer
        anchor="bottom"
        // FocusTrap captures this policy at opening; this component owns restoration after exit instead.
        ModalProps={{ disableRestoreFocus: true }}
        onClose={() => close()}
        open={menu.phase === "open"}
        slotProps={{
          paper: {
            ref: drawerPaperRef,
            "aria-labelledby": titleId,
            "aria-modal": true,
            id: sheetId,
            role: "dialog",
            sx: {
              backgroundImage: "none",
              bgcolor: "rgo.surfaceRaised",
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
              boxSizing: "border-box",
              maxHeight: "min(80dvh, 640px)",
              overflow: "hidden",
              px: 2,
              pb: "max(16px, env(safe-area-inset-bottom))",
            },
          },
          transition: {
            onExited: () => {
              completingRef.current = true;
              setMenu(current => ({ ...current, phase: "closed" }));
            },
          },
        }}
      >
        <AppBottomDrawerHandle onDismiss={() => close()} open={menu.phase === "open"} paperRef={drawerPaperRef} />
        <Stack
          direction="row"
          sx={{ alignItems: "center", flexShrink: 0, gap: 1, justifyContent: "space-between", mb: 1 }}
        >
          <Typography component="h2" id={titleId} sx={{ minWidth: 0, overflowWrap: "anywhere" }} variant="h6">
            {labels.pages}
          </Typography>
          <IconButton
            aria-label={labels.close}
            onClick={() => close()}
            sx={{ flexShrink: 0, minHeight: 44, minWidth: 44 }}
          >
            <CloseOutlinedIcon />
          </IconButton>
        </Stack>
        <Box sx={{ minHeight: 0, overflowY: "auto", overscrollBehavior: "contain" }}>
          <Box aria-label={labels.pages} component="nav">
            {renderLinks(true)}
          </Box>
          {!desktop && hasFooter ? <Box ref={setMobileFooter}>{footer}</Box> : null}
        </Box>
      </Drawer>
    </>
  );
}
