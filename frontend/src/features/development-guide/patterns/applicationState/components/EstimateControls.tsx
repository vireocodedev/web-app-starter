import { Stack, TextField } from "@mui/material";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

import { setEstimateHourlyRate, setEstimateHours } from "../signals/estimate/sigEstimate.actions";
import { sigEstimateHourlyRate, sigEstimateHours } from "../signals/estimate/sigEstimate";

export function EstimateControls() {
  const { t } = useDevelopmentGuideTranslation();

  return (
    <Stack
      direction={{ sm: "row", xs: "column" }}
      spacing={2}
      sx={{
        alignItems: "center",
        justifyContent: "center",
        maxWidth: 520,
        width: "100%",
      }}
    >
      <TextField
        fullWidth
        label={t("applicationStateExamples.shared.hoursLabel")}
        onChange={event => setEstimateHours(Number(event.target.value))}
        slotProps={{ htmlInput: { min: 0, step: 1 } }}
        sx={{ maxWidth: 240 }}
        type="number"
        value={sigEstimateHours.value}
      />
      <TextField
        fullWidth
        label={t("applicationStateExamples.shared.rateLabel")}
        onChange={event => setEstimateHourlyRate(Number(event.target.value))}
        slotProps={{ htmlInput: { min: 0, step: 5 } }}
        sx={{ maxWidth: 240 }}
        type="number"
        value={sigEstimateHourlyRate.value}
      />
    </Stack>
  );
}
