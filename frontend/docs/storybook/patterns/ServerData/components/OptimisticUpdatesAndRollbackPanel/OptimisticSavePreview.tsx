import { Alert, Button, Checkbox, CircularProgress, FormControlLabel, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { createOptimisticExampleApi, type OptimisticExampleApi } from "../../api/optimisticUpdates.api";
import { createOptimisticExampleMutation, createOptimisticExampleQuery } from "../../api/optimisticUpdates.query";

export function OptimisticSavePreview({ api: injectedApi }: Readonly<{ api?: OptimisticExampleApi }>) {
  const { t } = useDevelopmentGuideTranslation();
  const [api] = useState(() => injectedApi ?? createOptimisticExampleApi());
  const client = useQueryClient();
  const query = createOptimisticExampleQuery(api);
  const list = useQuery(query.list);
  const detail = useQuery(query.detail);
  const mutation = useMutation(createOptimisticExampleMutation(api, client));
  const [rejectSave, setRejectSave] = useState(false);
  const saving = useRef(false);

  const save = async () => {
    if (saving.current || !detail.data) return;
    saving.current = true;
    try {
      await mutation.mutateAsync({
        status: detail.data.status === "active" ? "paused" : "active",
        rejectSave,
      });
    } catch {
      // The mutation restores the snapshot; the error state below explains it.
    } finally {
      saving.current = false;
    }
  };

  if (list.isPending || detail.isPending)
    return <CircularProgress aria-label={t("serverDataExamples.optimistic.loading")} />;
  if (!list.data || !detail.data)
    return <Alert severity="error">{t("serverDataExamples.optimistic.loadFailed")}</Alert>;

  return (
    <Stack spacing={2} sx={{ maxWidth: 520, width: "100%" }}>
      <Stack aria-live="polite" spacing={1}>
        <Typography>
          {t("serverDataExamples.optimistic.collection", {
            status: t(`serverDataExamples.optimistic.status.${list.data[0].status}`),
          })}
        </Typography>
        <Typography>
          {t("serverDataExamples.optimistic.detail", {
            status: t(`serverDataExamples.optimistic.status.${detail.data.status}`),
          })}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {t("serverDataExamples.optimistic.revision", {
            revision: detail.data.revision,
          })}
        </Typography>
      </Stack>
      <FormControlLabel
        control={
          <Checkbox
            checked={rejectSave}
            disabled={mutation.isPending}
            onChange={(_, checked) => setRejectSave(checked)}
          />
        }
        label={t("serverDataExamples.optimistic.rejectSave")}
      />
      <Button disabled={mutation.isPending} onClick={() => void save()} variant="contained">
        {t(mutation.isPending ? "serverDataExamples.optimistic.saving" : "serverDataExamples.optimistic.save")}
      </Button>
      {mutation.isPending ? <Alert severity="info">{t("serverDataExamples.optimistic.pending")}</Alert> : null}
      {mutation.isError ? <Alert severity="error">{t("serverDataExamples.optimistic.failed")}</Alert> : null}
      {mutation.isSuccess ? <Alert severity="success">{t("serverDataExamples.optimistic.saved")}</Alert> : null}
    </Stack>
  );
}
