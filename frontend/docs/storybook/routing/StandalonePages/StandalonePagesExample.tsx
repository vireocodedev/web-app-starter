import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import { Button, Paper, Stack, Typography } from "@mui/material";
import { Link, Navigate, RouterProvider, type createMemoryRouter } from "react-router";

import { noFixedAppSettings } from "@/app/bootstrap/config/fixedSettings";
import type { AppNavigationItem } from "@/app/router/types/AppRoute";
import { AppShell } from "@/app/shell/components/AppShell";
import { useAppDisplayPreferences } from "@/app/theme/preferences/useAppDisplayPreferences";
import { StorybookBrowserFrame } from "../shared/StorybookBrowserFrame";

const standaloneNavigationItems = [
  {
    Icon: AssessmentOutlinedIcon,
    kind: "link",
    labelKey: "storybook.navigation.reports",

    to: "/reports",
  },
  {
    Icon: HelpOutlineOutlinedIcon,
    kind: "link",
    labelKey: "storybook.navigation.support",

    to: "/support",
  },
] satisfies readonly AppNavigationItem[];

export function StandalonePagesExample({ router }: Readonly<{ router: ReturnType<typeof createMemoryRouter> }>) {
  return <RouterProvider router={router} />;
}

export function StandalonePagesShell() {
  const { fixedColorMode } = useAppDisplayPreferences();
  return (
    <StorybookBrowserFrame>
      <AppShell
        fixedSettings={{
          ...noFixedAppSettings,
          drawerMode: "temporary",
          headerStickiness: "first-row",
          locale: "en",
          theme: fixedColorMode,
        }}
        navigationItems={standaloneNavigationItems}
      />
    </StorybookBrowserFrame>
  );
}

export function StandaloneHomeRedirect() {
  return <Navigate replace to="/reports" />;
}

export function ReportsPage() {
  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      <Typography color="text.secondary">Review your reports from this standalone page.</Typography>
      <Paper sx={{ p: 3 }} variant="outlined">
        <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
          <Typography component="h2" id="report-summary" variant="h5">
            Monthly summary
          </Typography>
          <Typography>
            Place report content here. The application shell already provides the page title and gutters.
          </Typography>
          <Button component={Link} to="/support" variant="outlined">
            Open Support
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}

export function SupportPage() {
  return (
    <Paper sx={{ p: 3 }} variant="outlined">
      <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
        <Typography component="h2" variant="h5">
          Get help
        </Typography>
        <Typography>
          Support is another independent page. Its URL and shell title change when you follow the link.
        </Typography>
        <Button component={Link} to="/reports" variant="outlined">
          Back to Reports
        </Button>
      </Stack>
    </Paper>
  );
}
