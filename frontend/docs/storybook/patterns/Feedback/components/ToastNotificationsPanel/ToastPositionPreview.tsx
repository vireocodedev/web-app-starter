import { Button, FormControl, InputLabel, MenuItem, Select, Stack, type SnackbarOrigin } from "@mui/material";
import { RgoFeedbackProvider, useRgoFeedback } from "@rgo-web/frontend";
import { useId, useState } from "react";

import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

const positions = [
  {
    id: "top-left",
    labelKey: "feedback.examples.position.topLeft",
    origin: { horizontal: "left", vertical: "top" },
  },
  {
    id: "top-center",
    labelKey: "feedback.examples.position.topCenter",
    origin: { horizontal: "center", vertical: "top" },
  },
  {
    id: "top-right",
    labelKey: "feedback.examples.position.topRight",
    origin: { horizontal: "right", vertical: "top" },
  },
  {
    id: "bottom-left",
    labelKey: "feedback.examples.position.bottomLeft",
    origin: { horizontal: "left", vertical: "bottom" },
  },
  {
    id: "bottom-center",
    labelKey: "feedback.examples.position.bottomCenter",
    origin: { horizontal: "center", vertical: "bottom" },
  },
  {
    id: "bottom-right",
    labelKey: "feedback.examples.position.bottomRight",
    origin: { horizontal: "right", vertical: "bottom" },
  },
] as const satisfies readonly Readonly<{
  id: string;
  labelKey: string;
  origin: SnackbarOrigin;
}>[];

type ToastPositionId = (typeof positions)[number]["id"];

function ToastPositionControls({
  onPositionChange,
  position,
}: Readonly<{
  onPositionChange: (position: ToastPositionId) => void;
  position: ToastPositionId;
}>) {
  const feedback = useRgoFeedback();
  const { t } = useDevelopmentGuideTranslation();
  const labelId = useId();

  return (
    <Stack
      direction={{ sm: "row", xs: "column" }}
      sx={{
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        maxWidth: "100%",
        mx: "auto",
        width: "fit-content",
      }}
    >
      <FormControl fullWidth size="small" sx={{ maxWidth: 240, minWidth: { sm: 200, xs: 0 } }}>
        <InputLabel id={labelId}>{t("feedback.examples.position.label")}</InputLabel>
        <Select
          label={t("feedback.examples.position.label")}
          labelId={labelId}
          onChange={event => onPositionChange(event.target.value as ToastPositionId)}
          value={position}
        >
          {positions.map(option => (
            <MenuItem key={option.id} value={option.id}>
              {t(option.labelKey)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        onClick={() =>
          feedback.notify({
            id: "example-position-notification",
            message: t("feedback.examples.position.message"),
            severity: "info",
          })
        }
        variant="contained"
      >
        {t("feedback.examples.position.action")}
      </Button>
    </Stack>
  );
}

/** Provides an isolated live preview for application-level toast positioning. */
export function ToastPositionPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const [position, setPosition] = useState<ToastPositionId>("top-right");
  const selectedPosition = positions.find(option => option.id === position) ?? positions[2];

  return (
    <Stack
      sx={{
        alignItems: "center",
        justifyContent: "center",
        mx: "auto",
        width: "100%",
      }}
    >
      <RgoFeedbackProvider
        notificationCloseLabel={t("feedback.closeNotification")}
        slotProps={{
          notification: { anchorOrigin: selectedPosition.origin },
        }}
      >
        <ToastPositionControls onPositionChange={setPosition} position={position} />
      </RgoFeedbackProvider>
    </Stack>
  );
}
