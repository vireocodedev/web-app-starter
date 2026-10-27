import { CircularProgress, Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { ServerDataRecordList } from "../ServerDataRecordList";
import { createServerDataExampleApi, type ServerDataExampleApi } from "../../api/serverData.api";
import { createServerDataExampleQuery } from "../../api/serverData.query";

type CancellationSearchPreviewProps = Readonly<{
  api?: ServerDataExampleApi;
}>;

export function CancellationSearchPreview({ api: apiOverride }: CancellationSearchPreviewProps) {
  const { t } = useDevelopmentGuideTranslation();
  const [api] = useState(() => apiOverride ?? createServerDataExampleApi());
  const [query] = useState(() => createServerDataExampleQuery(api));
  const [search, setSearch] = useState("");
  const records = useQuery(query.list({ pageSize: 3, search }));

  return (
    <Stack spacing={2.5} sx={{ alignItems: "center", maxWidth: 480, width: "100%" }}>
      <TextField
        fullWidth
        label={t("serverDataExamples.cancellation.automatic.label")}
        onChange={event => setSearch(event.target.value)}
        size="small"
        value={search}
      />
      {records.isFetching ? <CircularProgress size={26} /> : null}
      <ServerDataRecordList records={records.data?.items ?? []} />
    </Stack>
  );
}
