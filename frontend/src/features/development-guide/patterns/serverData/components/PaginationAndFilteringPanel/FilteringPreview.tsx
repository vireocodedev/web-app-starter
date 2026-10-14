import { CircularProgress, Pagination, Stack, TextField, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { ServerDataRecordList } from "../ServerDataRecordList";
import { createServerDataExampleApi } from "../../api/serverData.api";
import { createServerDataExampleQuery } from "../../api/serverData.query";

export function FilteringPreview() {
  const pageSize = 3;

  const { t } = useDevelopmentGuideTranslation();
  const [api] = useState(() => createServerDataExampleApi());
  const [query] = useState(() => createServerDataExampleQuery(api));
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const filters = { page, pageSize, search };
  const records = useQuery(query.list(filters));
  const pageCount = Math.max(1, Math.ceil((records.data?.total ?? 0) / pageSize));

  return (
    <Stack spacing={2.5} sx={{ alignItems: "center", maxWidth: 480, width: "100%" }}>
      <TextField
        fullWidth
        label={t("serverDataExamples.pagination.filtering.label")}
        onChange={event => {
          setSearch(event.target.value);
          setPage(1);
        }}
        size="small"
        value={search}
      />
      {records.isPending ? (
        <CircularProgress size={30} />
      ) : records.data?.items.length ? (
        <ServerDataRecordList records={records.data.items} />
      ) : (
        <Typography color="text.secondary" variant="body2">
          {t("serverDataExamples.pagination.filtering.empty")}
        </Typography>
      )}
      <Pagination
        count={pageCount}
        onChange={(_, value) => setPage(value)}
        page={Math.min(page, pageCount)}
        size="small"
      />
    </Stack>
  );
}
