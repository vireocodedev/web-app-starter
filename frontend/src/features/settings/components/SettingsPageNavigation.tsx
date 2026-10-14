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
import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { AppBottomDrawerHandle } from "@/app/overlays/components/AppBottomDrawerHandle";

type SettingsPageLink = Readonly<{ Icon: SvgIconComponent; label: string; to: string }>;
type MenuState = Readonly<{
  pathname: string;
  phase: "closed" | "open" | "closing";
  destination?: string;
  suppressRestoreFocus: boolean;
}>;

/** Page-owned navigation uses the Settings content container, independently of shell breakpoints. */
export function SettingsPageNavigation({
  container,
  links,
}: Readonly<{ container: HTMLElement | null; links: readonly SettingsPageLink[] }>) {
  const { t } = useAppTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const titleId = useId();
  const sheetId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerPaperRef = useRef<HTMLDivElement>(null);
  const completingRef = useRef(false);
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
    if (!menu.suppressRestoreFocus || menu.destination !== undefined) {
      triggerRef.current?.focus({ preventScroll: true });
    }
    if (menu.destination !== undefined) void navigate(menu.destination);
  }, [menu.destination, menu.phase, menu.suppressRestoreFocus, navigate]);

  const selectedLink = links.find(link => pathname === link.to || pathname.startsWith(`${link.to}/`));
  const CurrentIcon = selectedLink?.Icon ?? MenuOutlinedIcon;
  const currentLabel = selectedLink?.label ?? t("settings.pages");
  const close = (destination?: string) => {
    setMenu({ pathname, phase: "closing", destination, suppressRestoreFocus: destination !== undefined });
  };

  const renderLinks = (sheet: boolean) =>
    links.map(({ Icon, label, to }) => {
      const selected = pathname === to || pathname.startsWith(`${to}/`);
      return (
        <Box key={to} sx={{ pl: sheet ? 0 : 2.25, position: "relative" }}>
          {!sheet && selected ? (
            <Box
              aria-hidden="true"
              data-rgo-settings-active-line
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
          aria-label={t("settings.choosePage", { page: currentLabel })}
          data-rgo-settings-page-selector
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
        data-rgo-settings-navigation
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
        <Box aria-label={t("navigation.settings")} component="nav">
          {renderLinks(false)}
        </Box>
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
            {t("settings.pages")}
          </Typography>
          <IconButton
            aria-label={t("settings.closePages")}
            onClick={() => close()}
            sx={{ flexShrink: 0, minHeight: 44, minWidth: 44 }}
          >
            <CloseOutlinedIcon />
          </IconButton>
        </Stack>
        <Box
          aria-label={t("settings.pages")}
          component="nav"
          sx={{ minHeight: 0, overflowY: "auto", overscrollBehavior: "contain" }}
        >
          {renderLinks(true)}
        </Box>
      </Drawer>
    </>
  );
}
