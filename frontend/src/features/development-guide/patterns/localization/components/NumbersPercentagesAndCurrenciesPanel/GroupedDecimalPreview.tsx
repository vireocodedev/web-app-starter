import { Stack, Typography } from "@mui/material";
import { useAppLocalizationFormatters } from "@/app/localization/hooks/useAppLocalizationFormatters";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

export function GroupedDecimalPreview() {
  const { formatNumber } = useAppLocalizationFormatters();
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", width: "100%" }}>
      <Typography color="text.secondary" variant="body2">
        {t("localizationExamples.numbers.decimal.label")}
      </Typography>
      <Typography variant="h5">
        {formatNumber(1_284_500.75, {
          maximumFractionDigits: 2,
        })}
      </Typography>
    </Stack>
  );
}
