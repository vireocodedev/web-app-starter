import { Button, Stack, Typography } from "@mui/material";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { useAppQueryParams } from "@/app/router/hooks/useAppQueryParams";
import { searchParametersSchema } from "../../models/SearchParameters";

export function UrlPaginationPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const { get, set } = useAppQueryParams(searchParametersSchema);
  const page = get("page");

  return (
    <Stack spacing={2} sx={{ alignItems: "center", width: "100%" }}>
      <Typography variant="body1">{t("routingExamples.searchParams.history.current", { page })}</Typography>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
        {[1, 2, 3].map(value => (
          <Button key={value} onClick={() => set("page", value)} variant={page === value ? "contained" : "outlined"}>
            {value}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
