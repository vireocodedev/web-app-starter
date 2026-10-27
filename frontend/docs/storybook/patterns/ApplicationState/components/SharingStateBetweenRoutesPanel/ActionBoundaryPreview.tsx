import { Button, Stack } from "@mui/material";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { EstimateControls } from "../EstimateControls";
import { resetEstimate } from "../../signals/estimate/sigEstimate.actions";

export function ActionBoundaryPreview() {
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Stack spacing={2} sx={{ alignItems: "center", width: "100%" }}>
      <EstimateControls />
      <Button onClick={resetEstimate} variant="outlined">
        {t("applicationStateExamples.sharing.actions.reset")}
      </Button>
    </Stack>
  );
}
