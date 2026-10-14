import { Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useAppLocalizationFormatters } from "@/app/localization/hooks/useAppLocalizationFormatters";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { sigEstimateTotal } from "../../signals/estimate/sigEstimate";

export function NonReactiveReadPreview() {
  const { formatCurrency } = useAppLocalizationFormatters();
  const { t } = useDevelopmentGuideTranslation();
  const [recordedTotal, setRecordedTotal] = useState<number | null>(null);
  return (
    <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center", width: "100%" }}>
      <Typography color="text.secondary" variant="body2">
        {recordedTotal === null
          ? t("applicationStateExamples.effects.nonReactive.empty")
          : t("applicationStateExamples.effects.nonReactive.recorded", {
              total: formatCurrency(recordedTotal, "EUR"),
            })}
      </Typography>
      <Button onClick={() => setRecordedTotal(sigEstimateTotal.peek())} variant="contained">
        {t("applicationStateExamples.effects.nonReactive.action")}
      </Button>
    </Stack>
  );
}
