import { Button, Stack } from "@mui/material";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { EstimateSummary } from "../EstimateSummary";
import { hydrateEstimate } from "../../signals/estimate/sigEstimate.actions";

export function HydrationPreview() {
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Stack spacing={2} sx={{ alignItems: "center", width: "100%" }}>
      <EstimateSummary />
      <Button onClick={hydrateEstimate} variant="outlined">
        {t("applicationStateExamples.persistence.hydration.action")}
      </Button>
    </Stack>
  );
}
