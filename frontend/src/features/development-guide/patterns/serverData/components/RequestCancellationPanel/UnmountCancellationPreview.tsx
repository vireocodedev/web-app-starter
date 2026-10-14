import { Button, CircularProgress, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { createServerDataExampleApi, type ServerDataExampleApi } from "../../api/serverData.api";
import { createServerDataExampleQuery } from "../../api/serverData.query";

function MountedRequest({ api }: Readonly<{ api: ServerDataExampleApi }>) {
  const [query] = useState(() => createServerDataExampleQuery(api));
  const records = useQuery(query.list({ pageSize: 5 }));
  return records.isFetching ? <CircularProgress size={26} /> : null;
}

export function UnmountCancellationPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const [api] = useState(() => createServerDataExampleApi({ delayMs: 1_200 }));
  const [mounted, setMounted] = useState(true);

  return (
    <Stack spacing={2} sx={{ alignItems: "center", width: "100%" }}>
      {mounted ? <MountedRequest api={api} /> : null}
      <Button onClick={() => setMounted(current => !current)} variant="outlined">
        {t(mounted ? "serverDataExamples.cancellation.unmount.hide" : "serverDataExamples.cancellation.unmount.show")}
      </Button>
    </Stack>
  );
}
