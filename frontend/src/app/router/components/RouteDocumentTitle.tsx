import { useEffect } from "react";
import { useLocation, useMatches } from "react-router";

import type { AppRouteHandle } from "../types/AppRoute";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";

/** Resolves the deepest route-owned title metadata after localization is ready. */
export function RouteDocumentTitle() {
  const { t } = useAppTranslation();
  const matches = useMatches();
  const location = useLocation();

  useEffect(() => {
    const route = [...matches].reverse().find(match => Boolean(match.handle));
    const handle = route?.handle as AppRouteHandle | undefined;
    const routeTitle = handle?.resolveTitle({ app: t }, route?.params ?? {});

    document.title = routeTitle ? `${routeTitle} · ${t("navigation.shellTitle")}` : t("navigation.shellTitle");
  }, [location.key, matches, t]);

  return null;
}
