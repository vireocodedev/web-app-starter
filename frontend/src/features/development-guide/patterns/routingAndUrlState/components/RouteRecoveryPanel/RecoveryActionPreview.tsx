import { Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

const routeBase = "/dev-guide/frontend/patterns/routing-and-url-state/route-level-recovery";

export function RecoveryActionPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const { "*": childRoute = "summary" } = useParams();

  if (childRoute === "broken") throw new Error("Example route failure");

  return (
    <Stack spacing={2.5} sx={{ alignItems: "center", width: "100%" }}>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
        <Button component={RouterLink} to={`${routeBase}/summary`} variant="outlined">
          {t("routingExamples.recovery.preview.safe")}
        </Button>
        <Button color="error" component={RouterLink} to={`${routeBase}/broken`} variant="outlined">
          {t("routingExamples.recovery.preview.break")}
        </Button>
      </Stack>
      <Typography color="text.secondary" sx={{ textAlign: "center" }} variant="body2">
        {t("routingExamples.recovery.preview.ready")}
      </Typography>
    </Stack>
  );
}
