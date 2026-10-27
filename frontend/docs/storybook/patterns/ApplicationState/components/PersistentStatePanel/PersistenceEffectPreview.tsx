import { Chip, Stack, Typography } from "@mui/material";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { sigEstimatePersistenceStatus } from "../../signals/estimate/sigEstimate";

export function PersistenceEffectPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const persistenceStatus = sigEstimatePersistenceStatus.value;
  return (
    <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", width: "100%" }}>
      <Chip
        color={persistenceStatus === "saved" ? "success" : "warning"}
        label={t(`applicationStateExamples.persistence.effect.status.${persistenceStatus}`)}
        variant="outlined"
      />
      <Typography color="text.secondary" variant="body2">
        {t("applicationStateExamples.persistence.effect.hint")}
      </Typography>
    </Stack>
  );
}
