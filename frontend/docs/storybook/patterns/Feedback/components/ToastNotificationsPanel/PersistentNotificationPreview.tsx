import { Button, Stack } from "@mui/material";
import { useRgoFeedback } from "@rgo-web/frontend";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

const notificationId = "example-persistent-notification";

export function PersistentNotificationPreview() {
  const feedback = useRgoFeedback();
  const { t } = useDevelopmentGuideTranslation();
  const showPersistentNotification = () => {
    feedback.notify({
      durationMs: null,
      id: notificationId,
      message: t("feedback.examples.persistent.message"),
      severity: "warning",
    });
  };
  return (
    <Stack
      direction={{ sm: "row", xs: "column" }}
      sx={{
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        width: "100%",
      }}
    >
      <Button color="warning" onClick={showPersistentNotification} variant="contained">
        {t("feedback.examples.persistent.action")}
      </Button>
      <Button onClick={() => feedback.dismiss(notificationId)}>{t("feedback.examples.persistent.dismiss")}</Button>
    </Stack>
  );
}
