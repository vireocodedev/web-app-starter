import { Button, Stack } from "@mui/material";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { resetEstimate, setEstimate } from "../../signals/estimate/sigEstimate.actions";

export function BatchedActionPreview() {
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Stack
      direction={{ sm: "row", xs: "column" }}
      spacing={1}
      sx={{
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Button onClick={() => setEstimate({ hourlyRate: 90, hours: 12 })} variant="contained">
        {t("applicationStateExamples.source.batch.apply")}
      </Button>
      <Button onClick={resetEstimate} variant="outlined">
        {t("applicationStateExamples.source.batch.reset")}
      </Button>
    </Stack>
  );
}
