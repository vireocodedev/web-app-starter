import { Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { ServerDataRecordList } from "../ServerDataRecordList";
import { createServerDataExampleApi } from "../../api/serverData.api";
import { createServerDataExampleQuery } from "../../api/serverData.query";
import { ServerDataExampleQueryKey } from "../../api/serverData.querykeys";

export function QueryKeyPreview() {
  const pageSize = 4;

  const { t } = useDevelopmentGuideTranslation();
  const [api] = useState(() => createServerDataExampleApi());
  const [query] = useState(() => createServerDataExampleQuery(api));
  const [page] = useState(1);
  const [search] = useState("");
  const filters = { page, pageSize, search };
  const records = useQuery(query.list(filters));

  return (
    <Stack spacing={2.5} sx={{ alignItems: "center", maxWidth: 480, width: "100%" }}>
      {records.isPending ? (
        <CircularProgress size={30} />
      ) : records.data?.items.length ? (
        <ServerDataRecordList records={records.data.items} />
      ) : (
        <Typography color="text.secondary" variant="body2">
          {t("serverDataExamples.pagination.filtering.empty")}
        </Typography>
      )}
      <Chip
        label={JSON.stringify(ServerDataExampleQueryKey.list(filters))}
        size="small"
        sx={{ maxWidth: "100%", "& .MuiChip-label": { overflow: "hidden" } }}
        variant="outlined"
      />
    </Stack>
  );
}
