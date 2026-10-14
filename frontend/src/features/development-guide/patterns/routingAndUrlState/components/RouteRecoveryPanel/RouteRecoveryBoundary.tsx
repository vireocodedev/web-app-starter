import { Button, Stack, Typography } from "@mui/material";
import { isRouteErrorResponse, Link as RouterLink, useRouteError } from "react-router";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

const routeBase = "/dev-guide/patterns/routing-and-url-state/route-level-recovery";

export function RouteRecoveryBoundary() {
  const { t } = useDevelopmentGuideTranslation();
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : 500;

  return (
    <Stack spacing={2} sx={{ alignItems: "center", width: "100%" }}>
      <Typography color="error.main" sx={{ textAlign: "center" }} variant="body2">
        {t("routingExamples.recovery.preview.failed", { status })}
      </Typography>
      <Button component={RouterLink} replace to={`${routeBase}/summary`} variant="contained">
        {t("routingExamples.recovery.preview.recover")}
      </Button>
    </Stack>
  );
}
