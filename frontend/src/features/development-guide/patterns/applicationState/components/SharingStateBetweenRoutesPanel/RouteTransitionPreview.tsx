import { Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

export function RouteTransitionPreview() {
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center", width: "100%" }}>
      <Typography color="text.secondary" variant="body2">
        {t("applicationStateExamples.sharing.transition.hint")}
      </Typography>
      <Button
        component={RouterLink}
        to="/dev-guide/frontend/patterns/application-state/persistent-state"
        variant="contained"
      >
        {t("applicationStateExamples.sharing.transition.action")}
      </Button>
    </Stack>
  );
}
