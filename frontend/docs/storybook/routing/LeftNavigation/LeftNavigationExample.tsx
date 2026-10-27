import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { Link, Navigate, Outlet, RouterProvider, type createMemoryRouter } from "react-router";

import { noFixedAppSettings } from "@/app/bootstrap/config/fixedSettings";
import type { AppNavigationItem } from "@/app/router/types/AppRoute";
import { AppPageNavigation } from "@/app/shell/components/AppPageNavigation";
import { AppShell } from "@/app/shell/components/AppShell";
import { useAppDisplayPreferences } from "@/app/theme/preferences/useAppDisplayPreferences";
import { StorybookBrowserFrame } from "../shared/StorybookBrowserFrame";

const leftNavigationItems = [
  {
    Icon: FolderOutlinedIcon,
    kind: "link",
    labelKey: "storybook.navigation.project",

    to: "/project",
  },
] satisfies readonly AppNavigationItem[];

export function LeftNavigationExample({ router }: Readonly<{ router: ReturnType<typeof createMemoryRouter> }>) {
  return <RouterProvider router={router} />;
}

export function LeftNavigationShell() {
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
        navigationItems={leftNavigationItems}
      />
    </StorybookBrowserFrame>
  );
}

export function ProjectHomeRedirect() {
  return <Navigate replace to="/project" />;
}

/** The page owns its links and layout; AppPageNavigation owns responsive interaction. */
export function ProjectLayout({ maxWidth = 1280 }: Readonly<{ maxWidth?: number }>) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const links = [
    { Icon: DashboardOutlinedIcon, label: "Overview", to: "/project/overview" },
    { Icon: GroupOutlinedIcon, label: "Members", to: "/project/members" },
    { Icon: TimelineOutlinedIcon, label: "Activity", to: "/project/activity" },
  ];

  return (
    <Box
      data-rgo-page-surface="project"
      ref={setContainer}
      sx={{
        boxSizing: "border-box",
        containerType: "inline-size",
        marginInline: "auto",
        maxWidth,
        minWidth: 0,
        px: { xs: "16px", md: 0 },
        width: "100%",
      }}
    >
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
        <AppPageNavigation
          container={container}
          labels={{
            navigation: "Project navigation",
            pages: "Project pages",
            choosePage: page => `Choose project page: ${page}`,
            close: "Close project pages",
          }}
          links={links}
        />
        <Box sx={{ maxWidth: 860, minWidth: 0, width: "100%" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export function ProjectOverviewPage() {
  return (
    <Paper sx={{ p: 3 }} variant="outlined">
      <Stack spacing={2}>
        <Typography component="h2" variant="h5">
          Overview
        </Typography>
        <Typography>
          Keep the project summary here. The layout stays mounted while its outlet renders each selected page.
        </Typography>
        <Button component={Link} sx={{ alignSelf: "flex-start" }} to="/project/members" variant="outlined">
          Open Members
        </Button>
      </Stack>
    </Paper>
  );
}

export function ProjectMembersPage() {
  return (
    <Paper sx={{ p: 3 }} variant="outlined">
      <Stack spacing={2}>
        <Typography component="h2" variant="h5">
          Members
        </Typography>
        <Typography>
          List project members here. A nested details route shares the same layout and keeps Members selected.
        </Typography>
        <Button component={Link} sx={{ alignSelf: "flex-start" }} to="/project/members/details" variant="outlined">
          Open member details
        </Button>
      </Stack>
    </Paper>
  );
}

export function ProjectActivityPage() {
  return (
    <Paper sx={{ p: 3 }} variant="outlined">
      <Stack spacing={2}>
        <Typography component="h2" variant="h5">
          Activity
        </Typography>
        <Typography>
          Show recent project events here. Activity has its own URL, so it can be linked directly.
        </Typography>
      </Stack>
    </Paper>
  );
}

export function ProjectMemberDetailsPage() {
  return (
    <Paper sx={{ p: 3 }} variant="outlined">
      <Stack spacing={2}>
        <Typography component="h2" variant="h5">
          Member details
        </Typography>
        <Typography>
          This descendant does not add a fourth navigation item. The Members link remains active on this path.
        </Typography>
        <Button component={Link} sx={{ alignSelf: "flex-start" }} to="/project/members" variant="outlined">
          Back to Members
        </Button>
      </Stack>
    </Paper>
  );
}
