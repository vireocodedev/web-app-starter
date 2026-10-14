import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { createServerDataExampleApi } from "../../api/serverData.api";
import { ServerDataExampleQueryKey } from "../../api/serverData.querykeys";

export function LoadingStatePreview() {
  const { t } = useDevelopmentGuideTranslation();
  const [api] = useState(() => createServerDataExampleApi({ delayMs: 1_200 }));
  const result = useQuery({
    gcTime: 0,
    queryFn: ({ signal }) => api.findAll({}, { signal }),
    queryKey: ServerDataExampleQueryKey.loadingPreview(),
    retry: false,
  });

  if (result.isFetching) {
    return (
      <Stack spacing={1.5} sx={{ alignItems: "center", width: "100%" }}>
        <CircularProgress aria-label={t("serverDataExamples.queryStates.loading.label")} size={30} />
        <Typography color="text.secondary" variant="body2">
          {t("serverDataExamples.queryStates.loading.label")}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ alignItems: "center", width: "100%" }}>
      <Typography color="text.secondary" variant="body2">
        {t("serverDataExamples.queryStates.loading.ready")}
      </Typography>
      <Button onClick={() => void result.refetch()} variant="outlined">
        {t("serverDataExamples.queryStates.loading.replay")}
      </Button>
    </Stack>
  );
}
