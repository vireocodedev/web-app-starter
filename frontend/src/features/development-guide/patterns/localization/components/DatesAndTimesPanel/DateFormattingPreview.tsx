import { Stack, Typography } from "@mui/material";
import { useAppLocalizationFormatters } from "@/app/localization/hooks/useAppLocalizationFormatters";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

const exampleInstant = Date.UTC(2026, 8, 24, 14, 30);

export function DateFormattingPreview() {
  const { formatDate } = useAppLocalizationFormatters();
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", width: "100%" }}>
      <Typography color="text.secondary" variant="body2">
        {t("localizationExamples.dates.fixedInstant")}
      </Typography>
      <Typography variant="h5">{formatDate(exampleInstant)}</Typography>
    </Stack>
  );
}
