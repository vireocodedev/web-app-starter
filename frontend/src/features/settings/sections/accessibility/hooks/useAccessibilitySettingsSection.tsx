import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import { Button } from "@mui/material";

import { useAppFixedSettings } from "@/app/bootstrap/config/useAppFixedSettings";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useAppAccessibilityPreferences } from "@/app/theme/preferences/useAppAccessibilityPreferences";
import { useResetAppAccessibilityPreferences } from "@/app/theme/preferences/useResetAppAccessibilityPreferences";
import type { AppSettingsSectionDefinition } from "../../../types/AppSettingsSection";
import { LinkUnderlinePreferenceControl, MotionPreferenceControl } from "../components/AccessibilitySettingsControls";

/** Presents editable accessibility preferences from their theme owner. */
export function useAccessibilitySettingsSection(): AppSettingsSectionDefinition {
  const { t } = useAppTranslation();
  const fixedSettings = useAppFixedSettings();
  const { linkUnderlines, motion, setLinkUnderlines, setMotion } = useAppAccessibilityPreferences();

  return {
    id: "accessibility",
    title: t("settings.accessibility"),
    rows: [
      {
        control: (
          <MotionPreferenceControl
            label={t("settings.motion")}
            onChange={setMotion}
            reduceLabel={t("settings.motionReduce")}
            systemLabel={t("settings.motionSystem")}
            value={motion}
          />
        ),
        description: t("settings.motionDescription"),
        id: "motion",
        title: t("settings.motion"),
      },
      {
        control: (
          <LinkUnderlinePreferenceControl
            alwaysLabel={t("settings.linkUnderlinesAlways")}
            label={t("settings.linkUnderlines")}
            onChange={setLinkUnderlines}
            pageLabel={t("settings.linkUnderlinesPage")}
            value={linkUnderlines}
          />
        ),
        description: t("settings.linkUnderlinesDescription"),
        id: "link-underlines",
        title: t("settings.linkUnderlines"),
      },
    ].filter(row =>
      row.id === "motion" ? fixedSettings.motion === undefined : fixedSettings.linkUnderlines === undefined,
    ),
  };
}

/** Restores only the configurable Accessibility preferences. */
export function useResetAccessibilitySettingsSection(): AppSettingsSectionDefinition {
  const { t } = useAppTranslation();
  const resetAccessibilityPreferences = useResetAppAccessibilityPreferences();

  return {
    id: "accessibility-defaults",
    title: t("settings.defaultsSection"),
    rows: [
      {
        control: (
          <Button onClick={resetAccessibilityPreferences} startIcon={<RestartAltOutlinedIcon />} variant="outlined">
            {t("settings.restoreAccessibilityDefaultsAction")}
          </Button>
        ),
        description: t("settings.restoreAccessibilityDefaultsDescription"),
        id: "restore-accessibility-defaults",
        title: t("settings.restoreAccessibilityDefaults"),
      },
    ],
  };
}
