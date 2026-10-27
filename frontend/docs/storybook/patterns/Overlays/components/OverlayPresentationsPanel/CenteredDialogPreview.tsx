import { Button, Typography } from "@mui/material";
import { RgoOverlayFrame, useRgoOverlays, type RgoOverlayContentProps } from "@rgo-web/frontend";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { OverlayExampleWorkspace } from "../OverlayExampleWorkspace";

function PresentationContent({
  completeLabel,
  message,
  overlay,
  title,
}: Readonly<{ completeLabel: string; message: string; title: string }> & RgoOverlayContentProps<void>) {
  return (
    <RgoOverlayFrame
      footer={
        <Button onClick={() => void overlay.complete(undefined)} variant="contained">
          {completeLabel}
        </Button>
      }
      title={title}
    >
      <Typography color="text.secondary" variant="body2">
        {message}
      </Typography>
    </RgoOverlayFrame>
  );
}

function PresentationTrigger() {
  const overlays = useRgoOverlays();
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Button
      onClick={() => {
        void overlays.open(
          PresentationContent,
          {
            completeLabel: t("overlayExamples.complete"),
            message: t("overlayExamples.presentations.dialog.message"),
            title: t("overlayExamples.presentations.dialog.overlayTitle"),
          },
          { presentation: "dialog", maxWidth: "sm" },
        ).result;
      }}
      variant="contained"
    >
      {t("overlayExamples.presentations.dialog.action")}
    </Button>
  );
}

export function CenteredDialogPreview() {
  return (
    <OverlayExampleWorkspace pageKey="overlay-dialog-example">
      <PresentationTrigger />
    </OverlayExampleWorkspace>
  );
}
