import { Slider, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useAppLocalizationFormatters } from "@/app/localization/hooks/useAppLocalizationFormatters";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

export function PercentagePreview() {
  const { formatPercentage } = useAppLocalizationFormatters();
  const { t } = useDevelopmentGuideTranslation();
  const [completion, setCompletion] = useState(72);
  return (
    <Stack spacing={2} sx={{ alignItems: "center", width: "100%" }}>
      <Typography variant="h5">
        {formatPercentage(completion / 100, {
          maximumFractionDigits: 0,
        })}
      </Typography>
      <Slider
        aria-label={t("localizationExamples.numbers.percentage.label")}
        onChange={(_, value) => setCompletion(Array.isArray(value) ? (value[0] ?? 0) : value)}
        sx={{ maxWidth: 320, width: "100%" }}
        value={completion}
        valueLabelDisplay="auto"
      />
    </Stack>
  );
}
