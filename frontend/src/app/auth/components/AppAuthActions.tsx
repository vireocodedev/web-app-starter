import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { Divider, IconButton, ListItemIcon, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useAppAuth } from "../hooks/useAppAuth";
import { avatarInitials } from "../utils/userAvatarIdentity";
import { UserAvatar } from "./UserAvatar";

type AccountMenuState = Readonly<{
  anchor: HTMLElement | null;
  pathname: string;
  phase: "closed" | "open" | "closing";
  restoreFocus: boolean;
  destination?: string;
}>;

/** Header account corner with session details and route-provided account links. */
export function AppAuthActions({ developmentGuidePath }: Readonly<{ developmentGuidePath?: string | undefined }>) {
  const { t } = useAppTranslation();
  const { isLoggingOut, logout, user } = useAppAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const completingRef = useRef(false);
  const [menu, setMenu] = useState<AccountMenuState>({ anchor: null, pathname, phase: "closed", restoreFocus: true });
  const [logoutFailed, setLogoutFailed] = useState(false);
  const userName = user?.displayName ?? "";
  const initials = avatarInitials(userName);

  // External navigation owns the next page's focus, even when the account menu was open.
  if (menu.pathname !== pathname) {
    setMenu({
      ...menu,
      pathname,
      phase: menu.phase === "closed" ? "closed" : "closing",
      restoreFocus: false,
      destination: undefined,
    });
  }

  useEffect(() => {
    if (menu.phase !== "closed" || !completingRef.current) return;
    completingRef.current = false;
    // The menu has released its modal focus and aria-hidden ownership. Restore first so a
    // cancelled route confirmation has a useful target; successful navigation then focuses main.
    if (menu.restoreFocus) accountButtonRef.current?.focus({ preventScroll: true });
    if (menu.destination !== undefined) void navigate(menu.destination);
  }, [menu.destination, menu.phase, menu.restoreFocus, navigate]);

  async function handleLogout() {
    try {
      setLogoutFailed(false);
      await logout();
    } catch {
      setLogoutFailed(true);
    }
  }

  function closeMenu(destination?: string) {
    if (menu.phase !== "open") return;
    completingRef.current = true;
    setMenu({ ...menu, phase: "closing", destination });
  }

  function selectDestination(event: MouseEvent<HTMLElement>, destination: string) {
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
    closeMenu(pathname === destination ? undefined : destination);
  }

  const menuActionSx = { minHeight: 44, px: 2, gap: 1, whiteSpace: "normal" } as const;

  return (
    <>
      <Tooltip
        slotProps={{
          popper: {
            // Leave room for fractional tooltip widths at the viewport edge.
            modifiers: [{ name: "preventOverflow", options: { padding: 8 } }],
          },
        }}
        title={menu.phase === "closed" ? t("authentication.openAccountMenu") : ""}
      >
        <IconButton
          aria-controls={menu.phase === "open" ? "rgo-account-menu" : undefined}
          aria-expanded={menu.phase === "open"}
          aria-haspopup="menu"
          aria-label={`${t("authentication.account")} ${initials}`}
          color="inherit"
          onClick={event => {
            if (menu.phase !== "closed") return;
            setMenu({ anchor: event.currentTarget, pathname, phase: "open", restoreFocus: true });
          }}
          ref={accountButtonRef}
          sx={{ p: 0.5 }}
        >
          <UserAvatar name={userName} />
        </IconButton>
      </Tooltip>
      {menu.phase !== "closed" && (
        <Menu
          anchorEl={menu.anchor}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          disableRestoreFocus
          onClose={() => closeMenu()}
          open={menu.phase === "open"}
          slotProps={{
            list: { "aria-label": t("authentication.account"), id: "rgo-account-menu", sx: { py: 1 } },
            paper: { sx: { border: 1, borderColor: "divider", maxWidth: "calc(100vw - 24px)", minWidth: 248 } },
            transition: {
              onExited: () => {
                completingRef.current = true;
                setMenu(current => ({ ...current, anchor: null, phase: "closed" }));
              },
            },
          }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Stack
            component="li"
            direction="row"
            role="presentation"
            spacing={1}
            sx={{ alignItems: "center", px: 2, py: 1 }}
          >
            <UserAvatar name={userName} />
            <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }} variant="body2">
              {userName}
            </Typography>
          </Stack>
          <Divider />
          <MenuItem
            component={Link}
            onClick={event => selectDestination(event, "/settings/appearance")}
            sx={menuActionSx}
            to="/settings/appearance"
          >
            <ListItemIcon>
              <SettingsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            {t("navigation.settings")}
          </MenuItem>
          {import.meta.env.DEV && developmentGuidePath ? (
            <MenuItem
              component={Link}
              onClick={event => selectDestination(event, developmentGuidePath)}
              sx={menuActionSx}
              to={developmentGuidePath}
            >
              <ListItemIcon>
                <MenuBookOutlinedIcon fontSize="small" />
              </ListItemIcon>
              {t("navigation.developmentGuide")}
            </MenuItem>
          ) : null}
          <Divider />
          <MenuItem disabled={isLoggingOut} onClick={() => void handleLogout()} sx={menuActionSx}>
            <ListItemIcon>
              <LogoutOutlinedIcon fontSize="small" />
            </ListItemIcon>
            {t("authentication.signOut")}
          </MenuItem>
          {logoutFailed ? (
            <Typography component="li" color="error" role="alert" sx={{ px: 2, py: 1 }} variant="body2">
              {t("authentication.signOutFailed")}
            </Typography>
          ) : null}
        </Menu>
      )}
    </>
  );
}
