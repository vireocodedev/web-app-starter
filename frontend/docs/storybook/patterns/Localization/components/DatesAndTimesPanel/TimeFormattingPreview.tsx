import { Stack, Typography } from "@mui/material";
import { useAppLocalizationFormatters } from "@/app/localization/hooks/useAppLocalizationFormatters";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { defaultAppTimeZone } from "@/app/localization/localeConfig";

const exampleInstant = Date.UTC(2026, 8, 24, 14, 30);

export function TimeFormattingPreview() {
  const { formatTime } = useAppLocalizationFormatters();
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", width: "100%" }}>
      <Typography color="text.secondary" variant="body2">
        {t("localizationExamples.dates.applicationTimeZone", {
          timeZone: defaultAppTimeZone,
        })}
      </Typography>
      <Typography variant="h5">{formatTime(exampleInstant)}</Typography>
    </Stack>
  );
}
