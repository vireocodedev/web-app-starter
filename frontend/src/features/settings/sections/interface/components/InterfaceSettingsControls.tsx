import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CropSquareOutlinedIcon from "@mui/icons-material/CropSquareOutlined";
import DensityMediumOutlinedIcon from "@mui/icons-material/DensityMediumOutlined";
import DensitySmallOutlinedIcon from "@mui/icons-material/DensitySmallOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import PictureInPictureAltOutlinedIcon from "@mui/icons-material/PictureInPictureAltOutlined";
import SettingsBrightnessOutlinedIcon from "@mui/icons-material/SettingsBrightnessOutlined";
import TextDecreaseOutlinedIcon from "@mui/icons-material/TextDecreaseOutlined";
import TextIncreaseOutlinedIcon from "@mui/icons-material/TextIncreaseOutlined";
import TextFieldsOutlinedIcon from "@mui/icons-material/TextFieldsOutlined";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import ViewDayOutlinedIcon from "@mui/icons-material/ViewDayOutlined";
import VerticalAlignTopOutlinedIcon from "@mui/icons-material/VerticalAlignTopOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import VerticalSplitOutlinedIcon from "@mui/icons-material/VerticalSplitOutlined";
import WebAssetOutlinedIcon from "@mui/icons-material/WebAssetOutlined";
import { MenuItem, Select, Stack } from "@mui/material";
import { RgoCountryFlag } from "@rgo-web/frontend";

import { appLocalePresentation } from "@/app/localization/appLocalePresentation";
import { appLocales, type AppLocale } from "@/app/localization/localeConfig";
import type { AppDrawerMode, AppHeaderStickiness } from "@/app/shell/appShellConfig";
import type { AppDesktopTableSize, AppEditorPresentation, AppFontSize } from "@/app/theme/themeSetup";
import { themeSetup } from "@/app/theme/themeSetup";

import { SettingsChoiceToggleGroup } from "../../../components/SettingsChoiceToggleGroup";

export type AppThemePreference = "dark" | "soft-dark" | "light" | "system";

const cornerRoundnessOptions = (() => {
  const { max, min, step } = themeSetup.shape.surfaceBorderRadiusRange;
  return Array.from({ length: Math.floor((max - min) / step) + 1 }, (_value, index) => min + index * step);
})();

export function DrawerModeControl({
  label,
  onChange,
  permanentLabel,
  temporaryLabel,
  value,
}: Readonly<{
  label: string;
  onChange: (value: AppDrawerMode) => void;
  permanentLabel: string;
  temporaryLabel: string;
  value: AppDrawerMode;
}>) {
  return (
    <SettingsChoiceToggleGroup
      aria-label={label}
      onChange={nextValue => onChange(nextValue)}
      options={[
        { value: "temporary", label: temporaryLabel, icon: <WebAssetOutlinedIcon fontSize="small" /> },
        { value: "permanent", label: permanentLabel, icon: <ViewSidebarOutlinedIcon fontSize="small" /> },
      ]}
      value={value}
    />
  );
}

export function HeaderStickinessControl({
  bothRowsLabel,
  firstRowLabel,
  label,
  noneLabel,
  onChange,
  value,
}: Readonly<{
  bothRowsLabel: string;
  firstRowLabel: string;
  label: string;
  noneLabel: string;
  onChange: (value: AppHeaderStickiness) => void;
  value: AppHeaderStickiness;
}>) {
  return (
    <SettingsChoiceToggleGroup
      aria-label={label}
      onChange={nextValue => onChange(nextValue)}
      options={[
        { value: "first-row", label: firstRowLabel, icon: <VerticalAlignTopOutlinedIcon fontSize="small" /> },
        { value: "both-rows", label: bothRowsLabel, icon: <ViewDayOutlinedIcon fontSize="small" /> },
        { value: "none", label: noneLabel, icon: <BlockOutlinedIcon fontSize="small" /> },
      ]}
      value={value}
    />
  );
}

export function EditorPresentationControl({
  dialogLabel,
  dockedPanelLabel,
  label,
  onChange,
  overlayPanelLabel,
  value,
}: Readonly<{
  dialogLabel: string;
  dockedPanelLabel: string;
  label: string;
  onChange: (value: AppEditorPresentation) => void;
  overlayPanelLabel: string;
  value: AppEditorPresentation;
}>) {
  return (
    <SettingsChoiceToggleGroup
      aria-label={label}
      onChange={nextValue => onChange(nextValue)}
      options={[
        { value: "docked-panel", label: dockedPanelLabel, icon: <VerticalSplitOutlinedIcon fontSize="small" /> },
        { value: "dialog", label: dialogLabel, icon: <CropSquareOutlinedIcon fontSize="small" /> },
        {
          value: "overlay-panel",
          label: overlayPanelLabel,
          icon: <PictureInPictureAltOutlinedIcon fontSize="small" />,
        },
      ]}
      value={value}
    />
  );
}

export function DesktopTableSizeControl({
  label,
  mediumLabel,
  onChange,
  smallLabel,
  value,
}: Readonly<{
  label: string;
  mediumLabel: string;
  onChange: (value: AppDesktopTableSize) => void;
  smallLabel: string;
  value: AppDesktopTableSize;
}>) {
  return (
    <SettingsChoiceToggleGroup
      aria-label={label}
      onChange={nextValue => onChange(nextValue)}
      options={[
        { value: "small", label: smallLabel, icon: <DensitySmallOutlinedIcon fontSize="small" /> },
        { value: "medium", label: mediumLabel, icon: <DensityMediumOutlinedIcon fontSize="small" /> },
      ]}
      value={value}
    />
  );
}

export function ThemePreferenceControl({
  darkLabel,
  label,
  lightLabel,
  onChange,
  softDarkLabel,
  systemLabel,
  value,
}: Readonly<{
  darkLabel: string;
  label: string;
  lightLabel: string;
  onChange: (value: AppThemePreference) => void;
  softDarkLabel: string;
  systemLabel: string;
  value: AppThemePreference;
}>) {
  return (
    <SettingsChoiceToggleGroup
      aria-label={label}
      onChange={nextValue => onChange(nextValue)}
      options={[
        { value: "system", label: systemLabel, icon: <SettingsBrightnessOutlinedIcon fontSize="small" /> },
        { value: "light", label: lightLabel, icon: <LightModeOutlinedIcon fontSize="small" /> },
        { value: "dark", label: darkLabel, icon: <DarkModeOutlinedIcon fontSize="small" /> },
        { value: "soft-dark", label: softDarkLabel, icon: <DarkModeOutlinedIcon fontSize="small" /> },
      ]}
      sx={{
        "& [data-app-choice-icon]": { display: { xs: "none", sm: "flex" } },
        "@container (max-width: 420px)": { "& [data-app-choice-icon]": { display: "none" } },
        display: { xs: "grid", sm: "flex" },
        gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "none" },
      }}
      value={value}
    />
  );
}

export function LocaleControl({
  label,
  onChange,
  value,
}: Readonly<{
  label: string;
  onChange: (value: AppLocale) => void;
  value: AppLocale;
}>) {
  if (appLocales.length < 4) {
    return (
      <SettingsChoiceToggleGroup
        aria-label={label}
        onChange={nextValue => onChange(nextValue)}
        options={appLocales.map(supportedLocale => {
          const presentation = appLocalePresentation[supportedLocale];
          return {
            value: supportedLocale,
            label: presentation.shortLabel,
            icon: <RgoCountryFlag countryCode={presentation.countryCode} width={22} />,
          };
        })}
        value={value}
      />
    );
  }

  return (
    <Select
      fullWidth
      inputProps={{ "aria-label": label }}
      onChange={event => onChange(event.target.value as AppLocale)}
      renderValue={selectedLocale => {
        const presentation = appLocalePresentation[selectedLocale as AppLocale];
        return (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <RgoCountryFlag countryCode={presentation.countryCode} width={22} />
            <span>{presentation.shortLabel}</span>
          </Stack>
        );
      }}
      size="small"
      value={value}
    >
      {appLocales.map(supportedLocale => {
        const presentation = appLocalePresentation[supportedLocale];
        return (
          <MenuItem key={supportedLocale} value={supportedLocale}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <RgoCountryFlag countryCode={presentation.countryCode} width={22} />
              <span>{presentation.shortLabel}</span>
            </Stack>
          </MenuItem>
        );
      })}
    </Select>
  );
}

export function FontSizeControl({
  bigLabel,
  label,
  mediumLabel,
  normalLabel,
  onChange,
  value,
}: Readonly<{
  bigLabel: string;
  label: string;
  mediumLabel: string;
  normalLabel: string;
  onChange: (value: AppFontSize) => void;
  value: AppFontSize;
}>) {
  return (
    <SettingsChoiceToggleGroup
      aria-label={label}
      onChange={nextValue => onChange(nextValue)}
      options={[
        { value: "normal", label: normalLabel, icon: <TextDecreaseOutlinedIcon fontSize="small" /> },
        { value: "medium", label: mediumLabel, icon: <TextFieldsOutlinedIcon fontSize="small" /> },
        { value: "big", label: bigLabel, icon: <TextIncreaseOutlinedIcon fontSize="small" /> },
      ]}
      sx={{
        "& [data-app-choice-icon]": { display: { xs: "none", sm: "flex" } },
        "@container (max-width: 420px)": { "& [data-app-choice-icon]": { display: "none" } },
      }}
      value={value}
    />
  );
}

export function CornerRoundnessControl({
  label,
  onChange,
  value,
}: Readonly<{
  label: string;
  onChange: (value: number) => void;
  value: number;
}>) {
  return (
    <SettingsChoiceToggleGroup
      aria-label={label}
      onChange={nextValue => onChange(nextValue)}
      options={cornerRoundnessOptions.map(option => ({ value: option, label: `${option}px` }))}
      value={value}
    />
  );
}

export function BooleanPreferenceControl({
  checked,
  label,
  noLabel,
  onChange,
  yesLabel,
}: Readonly<{
  checked: boolean;
  label: string;
  noLabel: string;
  onChange: (checked: boolean) => void;
  yesLabel: string;
}>) {
  return (
    <SettingsChoiceToggleGroup
      aria-label={label}
      onChange={nextValue => onChange(nextValue)}
      options={[
        { value: false, label: noLabel, icon: <CloseOutlinedIcon color="error" fontSize="small" /> },
        { value: true, label: yesLabel, icon: <CheckOutlinedIcon color="success" fontSize="small" /> },
      ]}
      value={checked}
    />
  );
}
