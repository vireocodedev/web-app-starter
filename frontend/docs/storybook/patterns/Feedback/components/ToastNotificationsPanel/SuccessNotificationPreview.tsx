import { Button } from "@mui/material";
import { useRgoFeedback } from "@rgo-web/frontend";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

const notificationId = "example-success-notification";

export function SuccessNotificationPreview() {
  const feedback = useRgoFeedback();
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Button
      color="success"
      onClick={() =>
        feedback.notify({
          id: notificationId,
          message: t("feedback.examples.success.message"),
          severity: "success",
        })
      }
      variant="contained"
    >
      {t("feedback.examples.success.action")}
    </Button>
  );
}
