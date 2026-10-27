import { Alert, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { ServerDataRecordList } from "../ServerDataRecordList";
import { createServerDataExampleApi } from "../../api/serverData.api";
import { createServerDataExampleQuery } from "../../api/serverData.query";

export function ErrorStatePreview() {
  const outcome = "error";

  const { t } = useDevelopmentGuideTranslation();
  const [api] = useState(() => createServerDataExampleApi());
  const [query] = useState(() => createServerDataExampleQuery(api));
  const result = useQuery(query.list({ outcome }));

  if (result.isPending) {
    return (
      <Stack spacing={1.5} sx={{ alignItems: "center", width: "100%" }}>
        <CircularProgress aria-label={t("serverDataExamples.queryStates.loading.label")} size={30} />
        <Typography color="text.secondary" variant="body2">
          {t("serverDataExamples.queryStates.loading.label")}
        </Typography>
      </Stack>
    );
  }

  if (result.isError) {
    return (
      <Alert
        action={
          <Button color="inherit" onClick={() => result.refetch()} size="small">
            {t("serverDataExamples.shared.retry")}
          </Button>
        }
        severity="error"
        sx={{ maxWidth: 480, width: "100%" }}
      >
        {t("serverDataExamples.shared.requestFailed")}
      </Alert>
    );
  }

  if (result.data.items.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2" sx={{ textAlign: "center" }}>
        {t("serverDataExamples.queryStates.empty.message")}
      </Typography>
    );
  }

  return <ServerDataRecordList records={result.data.items} />;
}
