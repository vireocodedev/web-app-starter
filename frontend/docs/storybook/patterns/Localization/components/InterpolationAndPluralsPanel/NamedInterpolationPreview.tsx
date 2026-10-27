import { Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

export function NamedInterpolationPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const [name, setName] = useState<string>(t("localizationExamples.interpolation.named.initialName"));
  return (
    <Stack spacing={2} sx={{ alignItems: "center", width: "100%" }}>
      <TextField
        label={t("localizationExamples.interpolation.named.nameLabel")}
        onChange={event => setName(event.target.value)}
        size="small"
        value={name}
      />
      <Typography sx={{ textAlign: "center" }} variant="h6">
        {t("localizationExamples.interpolation.named.message", {
          name: name || t("localizationExamples.interpolation.named.fallbackName"),
        })}
      </Typography>
    </Stack>
  );
}
