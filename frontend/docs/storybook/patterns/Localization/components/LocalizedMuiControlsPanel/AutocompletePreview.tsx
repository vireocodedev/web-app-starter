import { Autocomplete, TextField } from "@mui/material";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

export function AutocompletePreview() {
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Autocomplete
      options={[
        t("localizationExamples.mui.autocomplete.firstProject"),
        t("localizationExamples.mui.autocomplete.secondProject"),
        t("localizationExamples.mui.autocomplete.thirdProject"),
      ]}
      renderInput={params => <TextField {...params} label={t("localizationExamples.mui.autocomplete.label")} />}
      sx={{ width: { sm: 320, xs: "100%" } }}
    />
  );
}
