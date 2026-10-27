import { Button } from "@mui/material";
import { useRgoFeedback } from "@rgo-web/frontend";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

const notificationId = "example-action-notification";

export function ActionNotificationPreview() {
  const feedback = useRgoFeedback();
  const { t } = useDevelopmentGuideTranslation();
  const showActionNotification = () => {
    feedback.notify({
      action: {
        label: t("feedback.examples.action.undo"),
        onClick: () => {
          feedback.notify({
            id: notificationId,
            message: t("feedback.examples.action.undoneMessage"),
            severity: "success",
          });
        },
      },
      id: notificationId,
      message: t("feedback.examples.action.message"),
      severity: "info",
    });
  };
  return (
    <Button color="info" onClick={showActionNotification} variant="contained">
      {t("feedback.examples.action.action")}
    </Button>
  );
}
