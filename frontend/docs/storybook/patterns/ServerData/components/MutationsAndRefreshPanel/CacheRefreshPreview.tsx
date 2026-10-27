import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { ServerDataRecordList } from "../ServerDataRecordList";
import { createServerDataExampleApi } from "../../api/serverData.api";
import { createServerDataExampleMutation } from "../../api/serverData.mutation";
import { createServerDataExampleQuery } from "../../api/serverData.query";

export function CacheRefreshPreview() {
  const pageSize = 3;

  const { t } = useDevelopmentGuideTranslation();
  const queryClient = useQueryClient();
  const [api] = useState(() => createServerDataExampleApi());
  const [query] = useState(() => createServerDataExampleQuery(api));
  const [mutation] = useState(() => createServerDataExampleMutation(api, queryClient));
  const records = useQuery(query.list({ pageSize }));
  const updateStatus = useMutation(mutation.updateStatus);
  const first = records.data?.items[0];

  if (records.isPending) return <CircularProgress size={30} />;

  const nextStatus = first?.status === "active" ? "paused" : "active";

  return (
    <Stack spacing={2.5} sx={{ alignItems: "center", width: "100%" }}>
      <ServerDataRecordList records={records.data?.items ?? []} />
      <Button
        disabled={!first || updateStatus.isPending}
        onClick={() => first && updateStatus.mutate({ id: first.id, status: nextStatus })}
        startIcon={updateStatus.isPending ? <CircularProgress color="inherit" size={16} /> : undefined}
        variant="contained"
      >
        {updateStatus.isPending
          ? t("serverDataExamples.mutations.pending.saving")
          : t(`serverDataExamples.mutations.pending.action.${nextStatus}`)}
      </Button>
      <Typography color="text.secondary" variant="caption" sx={{ textAlign: "center" }}>
        {records.isFetching
          ? t("serverDataExamples.mutations.refresh.refreshing")
          : t("serverDataExamples.mutations.refresh.ready")}
      </Typography>
    </Stack>
  );
}
