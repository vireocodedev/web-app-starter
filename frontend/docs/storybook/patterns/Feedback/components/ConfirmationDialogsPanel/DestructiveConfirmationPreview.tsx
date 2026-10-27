import { Button, Stack, Typography } from "@mui/material";
import { useRgoFeedback } from "@rgo-web/frontend";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

export function DestructiveConfirmationPreview() {
  const feedback = useRgoFeedback();
  const { t } = useDevelopmentGuideTranslation();
  const [status, setStatus] = useState<"cancelled" | "confirmed" | "idle">("idle");
  const requestConfirmation = async () => {
    const result = await feedback.confirm({
      cancelLabel: t("feedback.confirmationExamples.destructive.cancel"),
      confirmLabel: t("feedback.confirmationExamples.destructive.confirm"),
      message: t("feedback.confirmationExamples.destructive.message"),
      title: t("feedback.confirmationExamples.destructive.dialogTitle"),
      destructive: true,
    });
    setStatus(result.status);
  };
  const statusLabels = {
    cancelled: t("feedback.confirmationExamples.destructive.cancelled"),
    confirmed: t("feedback.confirmationExamples.destructive.confirmed"),
    idle: t("feedback.confirmationExamples.destructive.idle"),
  };
  return (
    <Stack sx={{ alignItems: "center", gap: 2, width: "100%" }}>
      <Button color="error" onClick={() => void requestConfirmation()} variant="contained">
        {t("feedback.confirmationExamples.destructive.action")}
      </Button>
      <Typography aria-live="polite" color="text.secondary" sx={{ textAlign: "center" }} variant="body2">
        {statusLabels[status]}
      </Typography>
    </Stack>
  );
}
