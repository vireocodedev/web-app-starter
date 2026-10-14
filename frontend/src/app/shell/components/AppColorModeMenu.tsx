import BrightnessAutoOutlinedIcon from "@mui/icons-material/BrightnessAutoOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { useState, type MouseEvent } from "react";

import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useAppColorScheme } from "@/app/theme/preferences/useAppColorScheme";

const modes = ["system", "light", "dark", "soft-dark"] as const;

export function AppColorModeMenu() {
  const { t } = useAppTranslation();
  const { mode, setMode } = useAppColorScheme();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const active = mode ?? "system";
  const Icon =
    active === "dark" || active === "soft-dark"
      ? DarkModeOutlinedIcon
      : active === "light"
        ? LightModeOutlinedIcon
        : BrightnessAutoOutlinedIcon;

  return (
    <>
      <Tooltip title={t("settings.theme")}>
        <IconButton
          aria-expanded={anchor !== null}
          aria-haspopup="menu"
          aria-label={t("settings.theme")}
          color="inherit"
          data-rgo-local-color-mode-control
          onClick={(event: MouseEvent<HTMLButtonElement>) => setAnchor(event.currentTarget)}
        >
          <Icon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        open={anchor !== null}
        slotProps={{ list: { "aria-label": t("settings.theme") } }}
      >
        {modes.map(next => (
          <MenuItem
            key={next}
            onClick={() => {
              setMode(next);
              setAnchor(null);
            }}
            selected={next === active}
          >
            {t(
              next === "system"
                ? "settings.themeSystem"
                : next === "light"
                  ? "settings.themeLight"
                  : next === "soft-dark"
                    ? "settings.themeSoftDark"
                    : "settings.themeDark",
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
