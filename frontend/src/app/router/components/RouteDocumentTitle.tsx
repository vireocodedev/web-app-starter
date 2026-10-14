import { useEffect } from "react";
import { useLocation, useMatches } from "react-router";

import type { AppRouteHandle } from "../types/AppRoute";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

/** Resolves the deepest route-owned title metadata after localization is ready. */
export function RouteDocumentTitle() {
  const { t } = useAppTranslation();
  const { t: guideT } = useDevelopmentGuideTranslation();
  const matches = useMatches();
  const location = useLocation();

  useEffect(() => {
    const route = [...matches].reverse().find(match => Boolean(match.handle));
    const handle = route?.handle as AppRouteHandle | undefined;
    const routeTitle = handle?.resolveTitle({ app: t, developmentGuide: guideT }, route?.params ?? {});

    document.title = routeTitle ? `${routeTitle} · ${t("navigation.shellTitle")}` : t("navigation.shellTitle");
  }, [guideT, location.key, matches, t]);

  return null;
}
