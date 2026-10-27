import { Chip } from "@mui/material";
import { useAppLocalization } from "@/app/localization/hooks/useAppLocalization";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

export function MuiLocaleBridgePreview() {
  const { locale } = useAppLocalization();
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Chip
      label={t("localizationExamples.mui.bridge.active", {
        locale: locale.toUpperCase(),
      })}
      variant="outlined"
    />
  );
}
