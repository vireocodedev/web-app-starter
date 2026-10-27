import { Button, Stack, Typography } from "@mui/material";
import { useRgoFeedback } from "@rgo-web/frontend";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

export function StandardConfirmationPreview() {
  const feedback = useRgoFeedback();
  const { t } = useDevelopmentGuideTranslation();
  const [status, setStatus] = useState<"cancelled" | "confirmed" | "idle">("idle");
  const requestConfirmation = async () => {
    const result = await feedback.confirm({
      cancelLabel: t("feedback.confirmationExamples.standard.cancel"),
      confirmLabel: t("feedback.confirmationExamples.standard.confirm"),
      message: t("feedback.confirmationExamples.standard.message"),
      title: t("feedback.confirmationExamples.standard.dialogTitle"),
    });
    setStatus(result.status);
  };
  const statusLabels = {
    cancelled: t("feedback.confirmationExamples.standard.cancelled"),
    confirmed: t("feedback.confirmationExamples.standard.confirmed"),
    idle: t("feedback.confirmationExamples.standard.idle"),
  };
  return (
    <Stack sx={{ alignItems: "center", gap: 2, width: "100%" }}>
      <Button onClick={() => void requestConfirmation()} variant="contained">
        {t("feedback.confirmationExamples.standard.action")}
      </Button>
      <Typography aria-live="polite" color="text.secondary" sx={{ textAlign: "center" }} variant="body2">
        {statusLabels[status]}
      </Typography>
    </Stack>
  );
}
