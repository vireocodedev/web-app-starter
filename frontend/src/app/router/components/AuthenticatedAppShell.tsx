import { AppShell } from "@/app/shell/components/AppShell";
import type { AppDrawerMode } from "@/app/shell/appShellConfig";
import type { AppNavigationItem, AppNavigationLink } from "../types/AppRoute";

import { AppAuthActions } from "@/app/auth/components/AppAuthActions";
import { useAppFixedSettings } from "@/app/bootstrap/config/useAppFixedSettings";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { AppCommandPalette } from "@/app/shell/components/AppCommandPalette";
import { parsePath, useLocation, useNavigate } from "react-router";
import { createAppCommandPaletteEntries } from "../routeCommandPalette";
import { appRouteRegistry } from "../routeRegistry";

/** Composes session actions into the otherwise authentication-agnostic shell. */
export function AuthenticatedAppShell({
  bottomNavigationItems,
  initialDrawerMode,
  navigationItems,
}: Readonly<{
  bottomNavigationItems: readonly AppNavigationLink[];
  initialDrawerMode?: AppDrawerMode;
  navigationItems: readonly AppNavigationItem[];
}>) {
  const fixedSettings = useAppFixedSettings();
  const { t: app } = useAppTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const entries = createAppCommandPaletteEntries(appRouteRegistry, { app });

  return (
    <AppShell
      bottomNavigationItems={bottomNavigationItems}
      accountActions={<AppAuthActions />}
      fixedSettings={fixedSettings}
      headerActions={
        <AppCommandPalette
          entries={entries}
          onNavigate={destination => {
            const pathname = parsePath(destination).pathname ?? "/";
            if (pathname.replace(/\/$/, "") !== location.pathname.replace(/\/$/, "")) void navigate(destination);
          }}
        />
      }
      initialDrawerMode={initialDrawerMode}
      navigationItems={navigationItems}
    />
  );
}
