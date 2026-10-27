import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import { Link as MuiLink, Paper, Stack, Typography } from "@mui/material";
import { Link, Navigate, RouterProvider, type createMemoryRouter } from "react-router";

import { noFixedAppSettings } from "@/app/bootstrap/config/fixedSettings";
import type { AppNavigationItem } from "@/app/router/types/AppRoute";
import { AppCategoryList, type AppCategoryListEntry } from "@/app/shell/components/AppCategoryList";
import { AppShell } from "@/app/shell/components/AppShell";
import { useAppDisplayPreferences } from "@/app/theme/preferences/useAppDisplayPreferences";
import { StorybookBrowserFrame } from "../shared/StorybookBrowserFrame";

const toolsNavigationItems = [
  {
    Icon: BuildOutlinedIcon,
    kind: "link",
    labelKey: "storybook.navigation.tools",

    to: "/tools",
  },
] satisfies readonly AppNavigationItem[];

const toolsChooserItems = [
  {
    id: "getting-started",
    Icon: RocketLaunchOutlinedIcon,
    label: "Getting started",
    description: "Start with the setup checklist for your workspace.",
    to: "/tools/getting-started",
  },
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        id: "members",
        Icon: GroupOutlinedIcon,
        label: "Members",
        description: "Manage the people in this workspace.",
        to: "/tools/members",
      },
      {
        id: "activity",
        Icon: TimelineOutlinedIcon,
        label: "Activity",
        description: "Review recent workspace changes.",
        to: "/tools/activity",
      },
    ],
  },
] satisfies readonly AppCategoryListEntry[];

export function NavigationChooserExample({ router }: Readonly<{ router: ReturnType<typeof createMemoryRouter> }>) {
  return <RouterProvider router={router} />;
}

export function NavigationChooserShell() {
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
        navigationItems={toolsNavigationItems}
      />
    </StorybookBrowserFrame>
  );
}

export function ToolsHomeRedirect() {
  return <Navigate replace to="/tools" />;
}

export function ToolsChooserPage() {
  return (
    <AppCategoryList
      title="Choose a tool"
      description="Choose a page to continue."
      navigationLabel="Tools navigation"
      items={toolsChooserItems}
    />
  );
}

export function ToolsGettingStartedPage() {
  return (
    <Paper sx={{ p: 3 }} variant="outlined">
      <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
        <Typography component="h2" variant="h5">
          Getting started
        </Typography>
        <Typography>Start with the setup checklist for your workspace.</Typography>
        <MuiLink component={Link} to="/tools">
          Back to Tools
        </MuiLink>
      </Stack>
    </Paper>
  );
}

export function ToolsMembersPage() {
  return (
    <Paper sx={{ p: 3 }} variant="outlined">
      <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
        <Typography component="h2" variant="h5">
          Members
        </Typography>
        <Typography>Manage the people in this workspace.</Typography>
        <MuiLink component={Link} to="/tools">
          Back to Tools
        </MuiLink>
      </Stack>
    </Paper>
  );
}

export function ToolsActivityPage() {
  return (
    <Paper sx={{ p: 3 }} variant="outlined">
      <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
        <Typography component="h2" variant="h5">
          Activity
        </Typography>
        <Typography>Review recent workspace changes.</Typography>
        <MuiLink component={Link} to="/tools">
          Back to Tools
        </MuiLink>
      </Stack>
    </Paper>
  );
}
