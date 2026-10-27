import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { useState, type MouseEvent } from "react";
import { Link, useLocation } from "react-router";

import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import type { AppNavigationItem, AppNavigationLink } from "@/app/router/types/AppRoute";
import { navigationPathMatchesLocation } from "./navigationPath";

type AppNavigationProps = Readonly<{
  collapsed?: boolean;
  navigationItems: readonly AppNavigationItem[];
  onNavigate?: () => void;
  variant: "panel" | "drawer";
}>;

function itemMatchesLocation(item: AppNavigationItem, pathname: string): boolean {
  if (item.kind === "menu") {
    return item.items.some(child => itemMatchesLocation(child, pathname));
  }
  return navigationPathMatchesLocation(pathname, item.to, item.activePath);
}

/** Renders top-level destinations in either the permanent panel or temporary drawer. */
export function AppNavigation({ collapsed = false, navigationItems, onNavigate, variant }: AppNavigationProps) {
  const { t } = useAppTranslation();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState<{ anchor: HTMLElement; item: Extract<AppNavigationItem, { kind: "menu" }> } | null>(
    null,
  );
  const iconOnly = variant === "panel" && collapsed;
  const label = (item: AppNavigationItem | AppNavigationLink) => t(item.labelKey);
  const closeMenu = () => setMenu(null);
  const selectDestination = () => {
    closeMenu();
    onNavigate?.();
  };

  return (
    <Box aria-label={t("navigation.primary")} component="nav" data-rgo-navigation-presentation={variant}>
      <List sx={{ display: "flex", flexDirection: "column", gap: 0.75, px: 1, py: 1.5 }}>
        {navigationItems.map(item => {
          const active = itemMatchesLocation(item, pathname);
          const itemLabel = label(item);
          const shared = {
            alignItems: "center",
            borderRadius: 1,
            color: "text.secondary",
            justifyContent: "flex-start",
            minHeight: 36,
            overflow: "hidden",
            position: "relative",
            px: 1,
            py: 0.625,
            width: "100%",
            "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "rgo.focus" },
            "&:hover": { bgcolor: "rgo.hover" },
            '&.Mui-selected, &[aria-current="page"]': {
              bgcolor: "rgo.navigationSelected",
              color: "text.primary",
            },
            "&.Mui-selected:hover": { bgcolor: "rgo.navigationSelected" },
          } as const;
          const button = (
            <ListItemButton
              aria-current={active ? "page" : undefined}
              aria-expanded={item.kind === "menu" ? menu?.item === item : undefined}
              aria-haspopup={item.kind === "menu" ? "menu" : undefined}
              aria-label={iconOnly ? itemLabel : undefined}
              component={item.kind === "link" ? Link : "button"}
              onClick={
                item.kind === "menu"
                  ? (event: MouseEvent<HTMLElement>) => setMenu({ anchor: event.currentTarget, item })
                  : selectDestination
              }
              selected={active}
              sx={shared}
              to={item.kind === "link" ? item.to : undefined}
            >
              <ListItemIcon
                data-rgo-navigation-icon
                sx={{
                  color: "inherit",
                  flexShrink: 0,
                  justifyContent: "center",
                  ml: 0.5,
                  minWidth: 36,
                }}
              >
                <item.Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                aria-hidden={iconOnly ? true : undefined}
                primary={itemLabel}
                sx={{
                  flex: "1 1 auto",
                  minWidth: 0,
                  opacity: iconOnly ? 0 : 1,
                  overflow: "hidden",
                  transition: theme =>
                    theme.transitions.create("opacity", {
                      duration: theme.transitions.duration.shorter,
                    }),
                  whiteSpace: "nowrap",
                  "@media (prefers-reduced-motion: reduce)": { transition: "none" },
                  "& .MuiListItemText-primary": {
                    fontWeight: active ? 700 : 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  },
                }}
              />
            </ListItemButton>
          );
          return (
            <ListItem
              disablePadding
              key={item.kind === "menu" ? item.labelKey : item.to}
              sx={{ pl: 2, position: "relative", pr: 2 }}
            >
              {active ? (
                <Box
                  aria-hidden="true"
                  component="span"
                  data-rgo-active-line
                  sx={{
                    bgcolor: "primary.main",
                    borderRadius: 1,
                    bottom: 6,
                    left: "-2px",
                    pointerEvents: "none",
                    position: "absolute",
                    top: 6,
                    width: 3,
                  }}
                />
              ) : null}
              <Tooltip
                disableFocusListener={!iconOnly}
                disableHoverListener={!iconOnly}
                placement="right"
                title={iconOnly ? itemLabel : ""}
              >
                {button}
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
      <Menu
        anchorEl={menu?.anchor}
        onClose={closeMenu}
        open={menu !== null}
        slotProps={{ list: { "aria-label": menu ? label(menu.item) : t("navigation.primary") } }}
      >
        {menu?.item.items.map(child => (
          <MenuItem
            aria-current={itemMatchesLocation(child, pathname) ? "page" : undefined}
            component={Link}
            key={child.to}
            onClick={selectDestination}
            selected={itemMatchesLocation(child, pathname)}
            to={child.to}
          >
            <ListItemIcon>
              <child.Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={label(child)} />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
