import { FormControlLabel, Stack, Switch } from "@mui/material";
import { useEffect, useState } from "react";
import { useAppLocalizationFormatters } from "@/app/localization/hooks/useAppLocalizationFormatters";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { EstimateControls } from "../EstimateControls";
import { sigEstimateTotal } from "../../signals/estimate/sigEstimate";

export function ComponentEffectPreview() {
  const { formatCurrency } = useAppLocalizationFormatters();
  const { t } = useDevelopmentGuideTranslation();
  const [enabled, setEnabled] = useState(false);
  const total = sigEstimateTotal.value;

  useEffect(() => {
    if (!enabled) return;

    const previousTitle = document.title;
    const formattedTotal = formatCurrency(total, "EUR");
    document.title = t("applicationStateExamples.effects.component.documentTitle", {
      total: formattedTotal,
    });

    return () => {
      document.title = previousTitle;
    };
  }, [enabled, formatCurrency, t, total]);

  return (
    <Stack spacing={2} sx={{ alignItems: "center", width: "100%" }}>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={(_, checked) => setEnabled(checked)} />}
        label={t("applicationStateExamples.effects.component.action")}
      />
      <EstimateControls />
    </Stack>
  );
}
