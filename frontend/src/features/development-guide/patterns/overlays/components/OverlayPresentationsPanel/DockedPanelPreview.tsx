import { Button, Typography } from "@mui/material";
import { RgoOverlayFrame, useRgoOverlays, type RgoOverlayContentProps } from "@rgo-web/frontend";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
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
            message: t("overlayExamples.presentations.docked.message"),
            title: t("overlayExamples.presentations.docked.overlayTitle"),
          },
          {
            presentation: "docked",
            resizable: true,
            side: "right",
            width: 360,
          },
        ).result;
      }}
      variant="contained"
    >
      {t("overlayExamples.presentations.docked.action")}
    </Button>
  );
}

export function DockedPanelPreview() {
  return (
    <OverlayExampleWorkspace pageKey="overlay-docked-example">
      <PresentationTrigger />
    </OverlayExampleWorkspace>
  );
}
