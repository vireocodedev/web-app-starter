import { FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useState } from "react";

import { defaultAppTimeZone } from "@/app/localization/localeConfig";
import { useAppLocalizationFormatters } from "@/app/localization/hooks/useAppLocalizationFormatters";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

const exampleInstant = Date.UTC(2026, 8, 24, 14, 30);
const timeZones = [...new Set([defaultAppTimeZone, "Europe/Zagreb", "America/New_York", "Asia/Tokyo"])];

export function ExplicitTimeZonePreview() {
  const { formatDateTime } = useAppLocalizationFormatters();
  const { t } = useDevelopmentGuideTranslation();
  const [timeZone, setTimeZone] = useState(defaultAppTimeZone);
  return (
    <Stack spacing={2} sx={{ alignItems: "center", width: "100%" }}>
      <FormControl size="small" sx={{ minWidth: 220 }}>
        <InputLabel id="example-time-zone-label">{t("localizationExamples.dates.dateTime.timeZoneLabel")}</InputLabel>
        <Select
          label={t("localizationExamples.dates.dateTime.timeZoneLabel")}
          labelId="example-time-zone-label"
          onChange={event => setTimeZone(event.target.value)}
          value={timeZone}
        >
          {timeZones.map(zone => (
            <MenuItem key={zone} value={zone}>
              {zone}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Typography sx={{ textAlign: "center" }} variant="h6">
        {formatDateTime(exampleInstant, { timeZone })}
      </Typography>
    </Stack>
  );
}
