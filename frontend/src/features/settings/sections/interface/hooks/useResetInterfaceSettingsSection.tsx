import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import { Button } from "@mui/material";
import { useCallback } from "react";

import { useResetAppLocale } from "@/app/localization/hooks/useResetAppLocale";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useResetAppShellPreferences } from "@/app/shell/preferences/useResetAppShellPreferences";
import { useResetAppThemePreferences } from "@/app/theme/preferences/useResetAppThemePreferences";

import type { AppSettingsSectionDefinition } from "../../../types/AppSettingsSection";

/** Restores configurable Appearance preferences without changing shell navigation. */
export function useResetAppearanceSettingsSection(): AppSettingsSectionDefinition {
  const { t } = useAppTranslation();
  const resetLocale = useResetAppLocale();
  const resetThemePreferences = useResetAppThemePreferences();

  const restoreDefaults = useCallback(() => {
    resetThemePreferences();
    resetLocale();
  }, [resetLocale, resetThemePreferences]);

  return {
    id: "appearance-defaults",
    rows: [
      {
        control: (
          <Button onClick={restoreDefaults} startIcon={<RestartAltOutlinedIcon />} variant="outlined">
            {t("settings.restoreInterfaceDefaultsAction")}
          </Button>
        ),
        description: t("settings.restoreInterfaceDefaultsDescription"),
        id: "restore-appearance-defaults",
        title: t("settings.restoreInterfaceDefaults"),
      },
    ],
    title: t("settings.defaultsSection"),
  };
}

/** Restores configurable shell navigation preferences without changing Appearance. */
export function useResetNavigationSettingsSection(): AppSettingsSectionDefinition {
  const { t } = useAppTranslation();
  const resetShellPreferences = useResetAppShellPreferences();

  return {
    id: "navigation-defaults",
    rows: [
      {
        control: (
          <Button onClick={resetShellPreferences} startIcon={<RestartAltOutlinedIcon />} variant="outlined">
            {t("settings.restoreNavigationDefaultsAction")}
          </Button>
        ),
        description: t("settings.restoreNavigationDefaultsDescription"),
        id: "restore-navigation-defaults",
        title: t("settings.restoreNavigationDefaults"),
      },
    ],
    title: t("settings.defaultsSection"),
  };
}
