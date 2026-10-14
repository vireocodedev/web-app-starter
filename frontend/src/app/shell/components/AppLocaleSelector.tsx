import { RgoCountryFlag } from "@rgo-web/frontend";
import { Button, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material";
import { useState, type MouseEvent } from "react";

import { appLocalePresentation } from "@/app/localization/appLocalePresentation";
import { appLocales, type AppLocale } from "@/app/localization/localeConfig";

type AppLocaleSelectorProps = Readonly<{
  ariaLabel: string;
  locale: AppLocale;
  onLocaleChange: (locale: AppLocale) => void;
}>;

/** Renders every locale registered by the application without binary assumptions. */
export function AppLocaleSelector({ ariaLabel, locale, onLocaleChange }: AppLocaleSelectorProps) {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const open = anchorElement !== null;

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorElement(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorElement(null);
  };

  const handleLocaleChange = (nextLocale: AppLocale) => {
    handleClose();
    onLocaleChange(nextLocale);
  };

  return (
    <>
      <Tooltip title={ariaLabel}>
        <Button
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`${ariaLabel} ${appLocalePresentation[locale].shortLabel}`}
          color="inherit"
          onClick={handleOpen}
          startIcon={<RgoCountryFlag countryCode={appLocalePresentation[locale].countryCode} width={22} />}
          sx={{
            flexShrink: 0,
            fontWeight: 600,
            gap: 2,
            height: theme => `max(44px, calc(${theme.typography.pxToRem(24)} + 16px))`,
            minWidth: 76,
            px: 0,
            py: 0,
            "& .MuiButton-startIcon": { m: 0 },
          }}
          variant="text"
        >
          {appLocalePresentation[locale].shortLabel}
        </Button>
      </Tooltip>

      <Menu
        anchorEl={anchorElement}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        onClose={handleClose}
        open={open}
        slotProps={{ list: { "aria-label": ariaLabel } }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
        {appLocales.map(supportedLocale => (
          <MenuItem
            key={supportedLocale}
            onClick={() => handleLocaleChange(supportedLocale)}
            selected={supportedLocale === locale}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <RgoCountryFlag countryCode={appLocalePresentation[supportedLocale].countryCode} width={24} />
            </ListItemIcon>
            <ListItemText primary={appLocalePresentation[supportedLocale].shortLabel} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
