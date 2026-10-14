import { Button, Stack, Typography } from "@mui/material";
import { useRgoFeedback } from "@rgo-web/frontend";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

export function AbortableConfirmationPreview() {
  const feedback = useRgoFeedback();
  const { t } = useDevelopmentGuideTranslation();
  const [status, setStatus] = useState<"cancelled" | "confirmed" | "idle">("idle");
  const requestConfirmation = async () => {
    const result = await feedback.confirm({
      cancelLabel: t("feedback.confirmationExamples.abortable.cancel"),
      confirmLabel: t("feedback.confirmationExamples.abortable.confirm"),
      message: t("feedback.confirmationExamples.abortable.message"),
      title: t("feedback.confirmationExamples.abortable.dialogTitle"),
      signal: AbortSignal.timeout(5000),
    });
    setStatus(result.status);
  };
  const statusLabels = {
    cancelled: t("feedback.confirmationExamples.abortable.cancelled"),
    confirmed: t("feedback.confirmationExamples.abortable.confirmed"),
    idle: t("feedback.confirmationExamples.abortable.idle"),
  };
  return (
    <Stack sx={{ alignItems: "center", gap: 2, width: "100%" }}>
      <Button onClick={() => void requestConfirmation()} variant="outlined">
        {t("feedback.confirmationExamples.abortable.action")}
      </Button>
      <Typography aria-live="polite" color="text.secondary" sx={{ textAlign: "center" }} variant="body2">
        {statusLabels[status]}
      </Typography>
    </Stack>
  );
}
