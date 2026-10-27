import { useEffect, useState, type ReactNode } from "react";
import { createMemoryRouter, RouterProvider, Link } from "react-router";
import { Stack, Typography } from "@mui/material";
import { StorybookAddressBar } from "../../routing/shared/StorybookAddressBar";
import { resetEstimate, hydrateEstimate } from "../ApplicationState/signals/estimate/sigEstimate.actions";
import { initEstimateSignalEffects } from "../ApplicationState/signals/estimate/sigEstimate.effects";
import { estimateStorage } from "../ApplicationState/signals/estimate/estimateStorage";

import { DependentFieldsPanel } from "../Forms/components/DependentFieldsPanel/DependentFieldsPanel";
import { PersistentStatePanel } from "../ApplicationState/components/PersistentStatePanel/PersistentStatePanel";
import { RouteRecoveryBoundary } from "../RoutingAndUrlState/components/RouteRecoveryPanel/RouteRecoveryBoundary";

/** Routes, persistence and lifecycle belong solely to the selected preview. */
export function PatternPreview({
  children,
  initialPath = "/patterns",
  routePath = "*",
  signals = false,
}: Readonly<{ children: ReactNode; initialPath?: string; routePath?: string; signals?: boolean }>) {
  const [router] = useState(() =>
    createMemoryRouter(
      [
        {
          path: routePath,
          errorElement: <RouteRecoveryBoundary />,
          element: (
            <Stack spacing={3}>
              <StorybookAddressBar />
              {children}
            </Stack>
          ),
        },
        {
          path: "/dev-guide/frontend/patterns/forms/dependent-fields",
          element: (
            <Stack spacing={3}>
              <StorybookAddressBar />
              <DependentFieldsPanel />
            </Stack>
          ),
        },
        {
          path: "/dev-guide/frontend/patterns/application-state/persistent-state",
          element: (
            <Stack spacing={3}>
              <StorybookAddressBar />
              <PersistentStatePanel />
            </Stack>
          ),
        },
        {
          path: "/projects",
          element: (
            <Stack spacing={3}>
              <StorybookAddressBar />
              <Typography component="h1" variant="h5">
                Projects preview
              </Typography>
              <Link to="/dev-guide/frontend/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/atlas">
                Open Atlas project
              </Link>
            </Stack>
          ),
        },
        ...(routePath === "*"
          ? []
          : [
              {
                path: "*",
                element: (
                  <Stack spacing={3}>
                    <StorybookAddressBar />
                    {children}
                  </Stack>
                ),
              },
            ]),
      ],
      { initialEntries: [initialPath] },
    ),
  );
  useEffect(() => {
    if (!signals) return;
    estimateStorage.reset();
    resetEstimate();
    hydrateEstimate();
    return initEstimateSignalEffects();
  }, [signals]);
  useEffect(() => () => router.dispose(), [router]);
  return <RouterProvider router={router} />;
}
