import { Button, Stack, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { createServerDataExampleApi, type ServerDataExampleApi } from "../../api/serverData.api";
import { createServerDataExampleQuery } from "../../api/serverData.query";
import { ServerDataExampleQueryKey } from "../../api/serverData.querykeys";

type ManualCancellationPreviewProps = Readonly<{
  api?: ServerDataExampleApi;
}>;

export function ManualCancellationPreview({ api: apiOverride }: ManualCancellationPreviewProps) {
  const { t } = useDevelopmentGuideTranslation();
  const queryClient = useQueryClient();
  const [api] = useState(() => apiOverride ?? createServerDataExampleApi({ delayMs: 1_200 }));
  const [query] = useState(() => createServerDataExampleQuery(api));
  const [wasCancelled, setWasCancelled] = useState(false);
  const filters = { pageSize: 4 };
  const records = useQuery(query.list(filters));

  return (
    <Stack spacing={2} sx={{ alignItems: "center", width: "100%" }}>
      <Stack direction={{ sm: "row", xs: "column" }} spacing={1}>
        <Button
          disabled={records.isFetching}
          onClick={() => {
            setWasCancelled(false);
            void records.refetch();
          }}
          variant="contained"
        >
          {t("serverDataExamples.cancellation.manual.start")}
        </Button>
        <Button
          disabled={!records.isFetching}
          onClick={() => {
            void queryClient
              .cancelQueries({
                exact: true,
                queryKey: ServerDataExampleQueryKey.list(filters),
              })
              .then(() => setWasCancelled(true));
          }}
          variant="outlined"
        >
          {t("serverDataExamples.cancellation.manual.action")}
        </Button>
      </Stack>
      <Typography color="text.secondary" variant="body2">
        {records.isFetching
          ? t("serverDataExamples.cancellation.manual.pending")
          : wasCancelled
            ? t("serverDataExamples.cancellation.manual.cancelled")
            : t("serverDataExamples.cancellation.manual.settled")}
      </Typography>
    </Stack>
  );
}
