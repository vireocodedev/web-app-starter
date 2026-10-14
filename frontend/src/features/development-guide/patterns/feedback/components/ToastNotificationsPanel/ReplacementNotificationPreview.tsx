import { Button, Stack } from "@mui/material";
import { useRgoFeedback } from "@rgo-web/frontend";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

const notificationId = "example-replacement-notification";

export function ReplacementNotificationPreview() {
  const feedback = useRgoFeedback();
  const { t } = useDevelopmentGuideTranslation();
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
      <Button
        onClick={() =>
          feedback.notify({
            id: notificationId,
            message: t("feedback.examples.replacement.initialMessage"),
            severity: "info",
          })
        }
        variant="contained"
      >
        {t("feedback.examples.replacement.initialAction")}
      </Button>
      <Button
        onClick={() =>
          feedback.notify({
            id: notificationId,
            message: t("feedback.examples.replacement.updatedMessage"),
            severity: "success",
          })
        }
        variant="outlined"
      >
        {t("feedback.examples.replacement.updatedAction")}
      </Button>
    </Stack>
  );
}
