import { useAppFixedSettings } from "@/app/bootstrap/config/useAppFixedSettings";
import { useAppLocalization } from "@/app/localization/hooks/useAppLocalization";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useAppShellPreferences } from "@/app/shell/preferences/useAppShellPreferences";
import { useAppDisplayPreferences } from "@/app/theme/preferences/useAppDisplayPreferences";
import { useAppColorScheme } from "@/app/theme/preferences/useAppColorScheme";
import { themeSetup } from "@/app/theme/themeSetup";
import type { AppSettingsRowDefinition, AppSettingsSectionDefinition } from "../../../types/AppSettingsSection";

import {
  BooleanPreferenceControl,
  CornerRoundnessControl,
  DesktopTableSizeControl,
  EditorPresentationControl,
  FontSizeControl,
  LocaleControl,
  DrawerModeControl,
  HeaderStickinessControl,
  ThemePreferenceControl,
  type AppThemePreference,
} from "../components/InterfaceSettingsControls";

/** Composes editable Appearance and Navigation preferences from their existing owners. */
export function useInterfaceSettingsSection(): AppSettingsSectionDefinition {
  const { t } = useAppTranslation();
  const fixedSettings = useAppFixedSettings();
  const { locale, setLocale } = useAppLocalization();
  const { mode, setMode } = useAppColorScheme();
  const {
    desktopTableSize,
    editorPresentation,
    fontSize,
    increasedContrast,
    setDesktopTableSize,
    setEditorPresentation,
    setFontSize,
    setIncreasedContrast,
    setSurfaceBorderRadius,
    surfaceBorderRadius,
  } = useAppDisplayPreferences();
  const { drawerMode, headerStickiness, setDrawerMode, setHeaderStickiness } = useAppShellPreferences();
  const themePreference = mode ?? themeSetup.defaultMode;
  const fixedValueByRowId: Readonly<Record<string, unknown>> = {
    "corner-roundness": fixedSettings.surfaceBorderRadius,
    "desktop-table-size": fixedSettings.desktopTableSize,
    "editor-presentation": fixedSettings.editorPresentation,
    "font-size": fixedSettings.fontSize,
    "increased-contrast": fixedSettings.increasedContrast,
    language: fixedSettings.locale,
    "drawer-mode": fixedSettings.drawerMode,
    "header-stickiness": fixedSettings.headerStickiness,
    theme: fixedSettings.theme,
  };
  const rows: AppSettingsRowDefinition[] = [
    {
      control: <LocaleControl label={t("settings.language")} onChange={setLocale} value={locale} />,
      description: t("settings.languageDescription"),
      id: "language",
      title: t("settings.language"),
    },
    {
      control: (
        <DrawerModeControl
          label={t("settings.drawerMode")}
          onChange={setDrawerMode}
          permanentLabel={t("settings.drawerPermanent")}
          temporaryLabel={t("settings.drawerTemporary")}
          value={drawerMode}
        />
      ),
      description: t("settings.drawerModeDescription"),
      id: "drawer-mode",
      title: t("settings.drawerMode"),
    },
    {
      control: (
        <HeaderStickinessControl
          bothRowsLabel={t("settings.headerStickinessBoth")}
          firstRowLabel={t("settings.headerStickinessFirst")}
          label={t("settings.headerStickiness")}
          noneLabel={t("settings.headerStickinessNone")}
          onChange={setHeaderStickiness}
          value={headerStickiness}
        />
      ),
      description: t("settings.headerStickinessDescription"),
      id: "header-stickiness",
      title: t("settings.headerStickiness"),
    },
    {
      control: (
        <FontSizeControl
          bigLabel={t("settings.fontSizeBig")}
          label={t("settings.fontSize")}
          mediumLabel={t("settings.fontSizeMedium")}
          normalLabel={t("settings.fontSizeNormal")}
          onChange={setFontSize}
          value={fontSize}
        />
      ),
      description: t("settings.fontSizeDescription"),
      id: "font-size",
      title: t("settings.fontSize"),
    },
    {
      control: (
        <DesktopTableSizeControl
          label={t("settings.desktopTableSize")}
          mediumLabel={t("settings.desktopTableSizeMedium")}
          onChange={setDesktopTableSize}
          smallLabel={t("settings.desktopTableSizeSmall")}
          value={desktopTableSize}
        />
      ),
      description: t("settings.desktopTableSizeDescription"),
      id: "desktop-table-size",
      title: t("settings.desktopTableSize"),
    },
    {
      control: (
        <ThemePreferenceControl
          darkLabel={t("settings.themeDark")}
          label={t("settings.theme")}
          lightLabel={t("settings.themeLight")}
          onChange={nextMode => setMode(nextMode)}
          softDarkLabel={t("settings.themeSoftDark")}
          systemLabel={t("settings.themeSystem")}
          value={themePreference as AppThemePreference}
        />
      ),
      description: t("settings.themeDescription"),
      id: "theme",
      title: t("settings.theme"),
    },
    {
      control: (
        <BooleanPreferenceControl
          checked={increasedContrast}
          label={t("settings.increasedContrast")}
          noLabel={t("settings.booleanNo")}
          onChange={setIncreasedContrast}
          yesLabel={t("settings.booleanYes")}
        />
      ),
      description: t("settings.increasedContrastDescription"),
      id: "increased-contrast",
      title: t("settings.increasedContrast"),
    },
    {
      control: (
        <EditorPresentationControl
          dialogLabel={t("settings.editorPresentationDialog")}
          dockedPanelLabel={t("settings.editorPresentationDockedPanel")}
          label={t("settings.editorPresentation")}
          onChange={setEditorPresentation}
          overlayPanelLabel={t("settings.editorPresentationOverlayPanel")}
          value={editorPresentation}
        />
      ),
      description: t("settings.editorPresentationDescription"),
      id: "editor-presentation",
      title: t("settings.editorPresentation"),
    },
    {
      control: (
        <CornerRoundnessControl
          label={t("settings.cornerRoundness")}
          onChange={setSurfaceBorderRadius}
          value={surfaceBorderRadius}
        />
      ),
      description: t("settings.cornerRoundnessDescription"),
      id: "corner-roundness",
      title: t("settings.cornerRoundness"),
    },
  ];

  return {
    id: "interface",
    title: t("settings.appearance"),
    rows: rows.filter(row => fixedValueByRowId[row.id] === undefined),
  };
}
