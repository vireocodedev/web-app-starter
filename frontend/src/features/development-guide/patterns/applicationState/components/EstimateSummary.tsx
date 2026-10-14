import { Stack, Typography } from "@mui/material";

import { useAppLocalizationFormatters } from "@/app/localization/hooks/useAppLocalizationFormatters";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

import { sigEstimateTotal, sigEstimateHourlyRate, sigEstimateHours } from "../signals/estimate/sigEstimate";

export function EstimateSummary() {
  const { formatCurrency } = useAppLocalizationFormatters();
  const { t } = useDevelopmentGuideTranslation();

  return (
    <Stack spacing={0.5} sx={{ alignItems: "center", textAlign: "center", width: "100%" }}>
      <Typography color="text.secondary" variant="body2">
        {t("applicationStateExamples.shared.formula", {
          hours: sigEstimateHours.value,
          rate: formatCurrency(sigEstimateHourlyRate.value, "EUR"),
        })}
      </Typography>
      <Typography aria-live="polite" variant="h4">
        {formatCurrency(sigEstimateTotal.value, "EUR")}
      </Typography>
    </Stack>
  );
}
