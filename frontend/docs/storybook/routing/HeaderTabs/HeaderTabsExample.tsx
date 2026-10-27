import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import { Button, Paper, Stack, Typography } from "@mui/material";
import { Link, Navigate, Outlet, RouterProvider, type createMemoryRouter } from "react-router";

import { noFixedAppSettings } from "@/app/bootstrap/config/fixedSettings";
import { useDevelopmentGuideTranslation } from "../../examples/shared/localization/useDevelopmentGuideTranslation";
import type { AppNavigationItem } from "@/app/router/types/AppRoute";
import { AppShell } from "@/app/shell/components/AppShell";
import { useAppDisplayPreferences } from "@/app/theme/preferences/useAppDisplayPreferences";
import { StorybookBrowserFrame } from "../shared/StorybookBrowserFrame";

const headerTabsNavigationItems = [
  {
    Icon: DashboardOutlinedIcon,
    kind: "link",
    labelKey: "storybook.headerTabs.workspace",

    to: "/workspace",
  },
] satisfies readonly AppNavigationItem[];

export function HeaderTabsExample({ router }: Readonly<{ router: ReturnType<typeof createMemoryRouter> }>) {
  return <RouterProvider router={router} />;
}

export function HeaderTabsShell() {
  const { fixedColorMode } = useAppDisplayPreferences();
  return (
    <StorybookBrowserFrame>
      <AppShell
        fixedSettings={{
          ...noFixedAppSettings,
          drawerMode: "temporary",
          headerStickiness: "both-rows",
          locale: "en",
          theme: fixedColorMode,
        }}
        navigationItems={headerTabsNavigationItems}
      />
    </StorybookBrowserFrame>
  );
}

export function WorkspaceHomeRedirect() {
  return <Navigate replace to="/workspace" />;
}

export function WorkspaceLayout() {
  return <Outlet />;
}

export function WorkspaceOverviewPage() {
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Paper sx={{ p: 3 }} variant="outlined">
      <Stack spacing={2}>
        <Typography component="h2" variant="h5">
          {t("headerTabs.overview")}
        </Typography>
        <Typography>{t("headerTabs.overviewDescription")}</Typography>
        <Button component={Link} sx={{ alignSelf: "flex-start" }} to="/workspace/activity" variant="outlined">
          {t("headerTabs.openActivity")}
        </Button>
      </Stack>
    </Paper>
  );
}

export function WorkspaceActivityPage() {
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Paper sx={{ p: 3 }} variant="outlined">
      <Stack spacing={2}>
        <Typography component="h2" variant="h5">
          {t("headerTabs.activity")}
        </Typography>
        <Typography>{t("headerTabs.activityDescription")}</Typography>
        <Button component={Link} sx={{ alignSelf: "flex-start" }} to="/workspace/activity/details" variant="outlined">
          {t("headerTabs.openDetails")}
        </Button>
      </Stack>
    </Paper>
  );
}

export function WorkspaceActivityDetailsPage() {
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Paper sx={{ p: 3 }} variant="outlined">
      <Stack spacing={2}>
        <Typography component="h2" variant="h5">
          {t("headerTabs.details")}
        </Typography>
        <Typography>{t("headerTabs.detailsDescription")}</Typography>
        <Button component={Link} sx={{ alignSelf: "flex-start" }} to="/workspace/activity" variant="outlined">
          {t("headerTabs.backToActivity")}
        </Button>
      </Stack>
    </Paper>
  );
}
