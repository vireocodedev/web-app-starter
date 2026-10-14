import AccessibilityNewOutlinedIcon from "@mui/icons-material/AccessibilityNewOutlined";
import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import { Alert, Box, Link as MuiLink, Stack, Typography } from "@mui/material";
import { useState, type ReactNode } from "react";
import { Link, Outlet } from "react-router";

import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import {
  AppSettingsPanel,
  SettingsPageNavigation,
  useAccessibilitySettingsSection,
  useInterfaceSettingsSection,
  useResetAccessibilitySettingsSection,
  useResetAppearanceSettingsSection,
  useResetNavigationSettingsSection,
  type AppSettingsRowDefinition,
  type AppSettingsSectionDefinition,
} from "@/features/settings";

const appearancePath = "/settings/appearance";
const navigationPath = "/settings/navigation";
const accessibilityPath = "/settings/accessibility";

type SettingsAccount = Readonly<{ avatar: ReactNode; displayName: string; email: string }>;
type GroupDefinition = Readonly<{ id: string; title: string; rowIds: readonly string[] }>;

/** Keeps account identity and section navigation available to every Settings child route. */
export function SettingsLayoutPage({ account }: Readonly<{ account: SettingsAccount | null }>) {
  const { t } = useAppTranslation();
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const links = [
    { Icon: BrushOutlinedIcon, label: t("settings.appearance"), to: appearancePath },
    { Icon: MenuOutlinedIcon, label: t("settings.navigation"), to: navigationPath },
    { Icon: AccessibilityNewOutlinedIcon, label: t("settings.accessibility"), to: accessibilityPath },
  ];

  return (
    <Box
      data-rgo-page-surface="settings"
      ref={setContainer}
      sx={{
        boxSizing: "border-box",
        containerType: "inline-size",
        marginInline: "auto",
        maxWidth: 1280,
        minWidth: 0,
        px: { xs: "16px", md: 0 },
        width: "100%",
      }}
    >
      {account ? (
        <Stack
          data-rgo-settings-account
          direction="row"
          spacing={1.75}
          sx={{ alignItems: "center", mb: 3, minWidth: 0 }}
        >
          {account.avatar}
          <Box sx={{ minWidth: 0 }}>
            <Typography component="p" sx={{ fontWeight: 700, lineHeight: 1.25, overflowWrap: "anywhere" }} variant="h6">
              {account.displayName}
            </Typography>
            <Typography sx={{ color: "rgo.textMuted", overflowWrap: "anywhere" }} variant="body2">
              {account.email}
            </Typography>
          </Box>
        </Stack>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gap: 3,
          minWidth: 0,
          "@container (min-width: 900px)": {
            alignItems: "start",
            gap: 4,
            gridTemplateColumns: "240px minmax(0, 1fr)",
          },
        }}
      >
        <SettingsPageNavigation container={container} links={links} />

        <Box data-rgo-settings-content sx={{ maxWidth: 860, minWidth: 0, width: "100%" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

/** Theme, contrast, language, density, shape, and editor controls live on Appearance. */
export function SettingsAppearancePage() {
  const { t } = useAppTranslation();
  const interfaceSection = useInterfaceSettingsSection();
  const resetSection = useResetAppearanceSettingsSection();
  const rowsById = new Map(interfaceSection.rows.map(row => [row.id, row]));
  const groups = selectGroups(rowsById, [
    { id: "theme-language", title: t("settings.appearanceThemeLanguage"), rowIds: ["theme", "language"] },
    { id: "contrast", title: t("settings.appearanceContrast"), rowIds: ["increased-contrast"] },
    {
      id: "density-shape",
      title: t("settings.appearanceDensityShape"),
      rowIds: ["font-size", "desktop-table-size", "corner-roundness"],
    },
    { id: "editors", title: t("settings.appearanceEditors"), rowIds: ["editor-presentation"] },
  ]);

  return (
    <SettingsSectionPage
      groups={groups}
      managedDescription={t("settings.managedAppearanceDescription")}
      resetRow={resetSection.rows[0]}
      title={t("settings.appearance")}
    />
  );
}

/** Shell drawer and header controls live on Navigation. */
export function SettingsNavigationPage() {
  const { t } = useAppTranslation();
  const interfaceSection = useInterfaceSettingsSection();
  const resetSection = useResetNavigationSettingsSection();
  const rowsById = new Map(interfaceSection.rows.map(row => [row.id, row]));
  const groups = selectGroups(rowsById, [
    { id: "navigation", title: t("settings.navigation"), rowIds: ["drawer-mode", "header-stickiness"] },
  ]);

  return (
    <SettingsSectionPage
      groups={groups}
      managedDescription={t("settings.managedNavigationDescription")}
      resetRow={resetSection.rows[0]}
      title={t("settings.navigation")}
    />
  );
}

/** Motion and link readability controls live on Accessibility. */
export function SettingsAccessibilityPage() {
  const { t } = useAppTranslation();
  const accessibilitySection = useAccessibilitySettingsSection();
  const resetSection = useResetAccessibilitySettingsSection();
  const rowsById = new Map(accessibilitySection.rows.map(row => [row.id, row]));
  const groups = selectGroups(rowsById, [
    { id: "motion", title: t("settings.accessibilityMotionGroup"), rowIds: ["motion"] },
    { id: "links", title: t("settings.accessibilityLinksGroup"), rowIds: ["link-underlines"] },
  ]);

  return (
    <SettingsSectionPage
      groups={groups}
      managedDescription={t("settings.managedAccessibilityDescription")}
      preview={
        <Typography sx={{ color: "rgo.textMuted", mb: 2 }} variant="body2">
          {t("settings.linkPreview")}{" "}
          <MuiLink component={Link} to={appearancePath} underline="hover">
            {t("settings.linkPreviewAction")}
          </MuiLink>
        </Typography>
      }
      resetRow={resetSection.rows[0]}
      title={t("settings.accessibility")}
    />
  );
}

function selectGroups(
  rowsById: ReadonlyMap<string, AppSettingsRowDefinition>,
  definitions: readonly GroupDefinition[],
) {
  return definitions
    .map(({ id, title, rowIds }): AppSettingsSectionDefinition => ({
      id,
      title,
      rows: rowIds
        .map(rowId => rowsById.get(rowId))
        .filter((row): row is AppSettingsRowDefinition => row !== undefined),
    }))
    .filter(group => group.rows.length > 0);
}

function SettingsSectionPage({
  groups,
  managedDescription,
  preview,
  resetRow,
  title,
}: Readonly<{
  groups: readonly AppSettingsSectionDefinition[];
  managedDescription: string;
  preview?: ReactNode;
  resetRow?: AppSettingsRowDefinition;
  title: string;
}>) {
  const { t } = useAppTranslation();
  const hasEditablePreferences = groups.some(group => group.rows.length > 0);

  return (
    <>
      <Typography component="h1" sx={{ fontWeight: 600, mb: 1.5 }} variant="h4">
        {title}
      </Typography>
      {preview}
      {hasEditablePreferences ? (
        <AppSettingsPanel groups={groups} resetRow={resetRow} />
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography sx={{ fontWeight: 600 }} variant="body2">
            {t("settings.noConfigurableOptions")}
          </Typography>
          <Typography variant="body2">{managedDescription}</Typography>
        </Alert>
      )}
    </>
  );
}
