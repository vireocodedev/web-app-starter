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
            message: t("overlayExamples.presentations.modalPanel.message"),
            title: t("overlayExamples.presentations.modalPanel.overlayTitle"),
          },
          {
            presentation: "modal-panel",
            resizable: true,
            side: "right",
            width: 420,
          },
        ).result;
      }}
      variant="contained"
    >
      {t("overlayExamples.presentations.modalPanel.action")}
    </Button>
  );
}

export function ModalPanelPreview() {
  return (
    <OverlayExampleWorkspace pageKey="overlay-modal-panel-example">
      <PresentationTrigger />
    </OverlayExampleWorkspace>
  );
}
