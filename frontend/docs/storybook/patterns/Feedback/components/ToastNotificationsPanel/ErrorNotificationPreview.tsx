import { Button } from "@mui/material";
import { useRgoFeedback } from "@rgo-web/frontend";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

const notificationId = "example-error-notification";

export function ErrorNotificationPreview() {
  const feedback = useRgoFeedback();
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Button
      color="error"
      onClick={() =>
        feedback.notify({
          id: notificationId,
          message: t("feedback.examples.error.message"),
          severity: "error",
        })
      }
      variant="contained"
    >
      {t("feedback.examples.error.action")}
    </Button>
  );
}
