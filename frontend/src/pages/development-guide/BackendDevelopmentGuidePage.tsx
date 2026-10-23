import { Typography } from "@mui/material";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

export function BackendDevelopmentGuidePage() {
  const { t } = useDevelopmentGuideTranslation();

  return <Typography>{t("backendGuide.greeting")}</Typography>;
}
