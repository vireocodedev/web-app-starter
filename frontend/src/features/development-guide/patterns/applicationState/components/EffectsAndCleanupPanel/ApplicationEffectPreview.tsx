import { Chip, Stack, Typography } from "@mui/material";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { sigEstimatePersistenceStatus } from "../../signals/estimate/sigEstimate";

export function ApplicationEffectPreview() {
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", width: "100%" }}>
      <Chip
        color={sigEstimatePersistenceStatus.value === "saved" ? "success" : "warning"}
        label={t("applicationStateExamples.effects.application.active")}
        variant="outlined"
      />
      <Typography color="text.secondary" variant="body2">
        {t("applicationStateExamples.effects.application.hint")}
      </Typography>
    </Stack>
  );
}
