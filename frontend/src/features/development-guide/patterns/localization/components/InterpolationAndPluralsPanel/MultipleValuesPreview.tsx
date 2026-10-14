import { Typography } from "@mui/material";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

export function MultipleValuesPreview() {
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Typography sx={{ textAlign: "center" }} variant="h6">
      {t("localizationExamples.interpolation.multiple.message", {
        actor: t("localizationExamples.interpolation.multiple.actor"),
        project: t("localizationExamples.interpolation.multiple.project"),
      })}
    </Typography>
  );
}
