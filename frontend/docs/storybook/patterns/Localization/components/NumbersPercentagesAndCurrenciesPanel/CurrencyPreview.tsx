import { FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useAppLocalizationFormatters } from "@/app/localization/hooks/useAppLocalizationFormatters";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

export function CurrencyPreview() {
  const { formatCurrency } = useAppLocalizationFormatters();
  const { t } = useDevelopmentGuideTranslation();
  const [currency, setCurrency] = useState("EUR");
  return (
    <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center", width: "100%" }}>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel id="example-currency-label">{t("localizationExamples.numbers.currency.label")}</InputLabel>
        <Select
          label={t("localizationExamples.numbers.currency.label")}
          labelId="example-currency-label"
          onChange={event => setCurrency(event.target.value)}
          value={currency}
        >
          <MenuItem value="EUR">EUR</MenuItem>
          <MenuItem value="USD">USD</MenuItem>
          <MenuItem value="GBP">GBP</MenuItem>
        </Select>
      </FormControl>
      <Typography variant="h5">{formatCurrency(18_450.5, currency)}</Typography>
    </Stack>
  );
}
