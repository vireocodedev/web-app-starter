import { Chip, Stack, TextField, Typography } from "@mui/material";
import { useLocation } from "react-router";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { useAppQueryParams } from "@/app/router/hooks/useAppQueryParams";
import { searchParametersSchema } from "../../models/SearchParameters";

export function UrlFilterPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const { search } = useLocation();
  const { values, setValues } = useAppQueryParams(searchParametersSchema);

  return (
    <Stack spacing={2.5} sx={{ alignItems: "center", width: "100%" }}>
      <TextField
        label={t("routingExamples.searchParams.filters.queryLabel")}
        onChange={event => setValues({ q: event.target.value, page: 1 }, { replace: true })}
        size="small"
        value={values.q}
      />
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
        {(["all", "active", "archived"] as const).map(value => (
          <Chip
            color={values.status === value ? "primary" : "default"}
            key={value}
            label={t(`routingExamples.searchParams.filters.status.${value}`)}
            onClick={() => setValues({ status: value, page: 1 }, { replace: true })}
            variant={values.status === value ? "filled" : "outlined"}
          />
        ))}
      </Stack>
      <Typography color="text.secondary" variant="body2">
        {search || "?"}
      </Typography>
    </Stack>
  );
}
