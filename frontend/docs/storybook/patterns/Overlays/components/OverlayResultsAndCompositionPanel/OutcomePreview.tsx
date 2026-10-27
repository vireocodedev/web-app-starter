import { Button, Stack, Typography } from "@mui/material";
import { RgoOverlayFrame, useRgoOverlays, type RgoOverlayContentProps, type RgoOverlayResult } from "@rgo-web/frontend";
import { useState, type ReactNode } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { OverlayExampleWorkspace } from "../OverlayExampleWorkspace";

function OutcomePreviewContent() {
  const overlays = useRgoOverlays();
  const { t } = useDevelopmentGuideTranslation();
  const [result, setResult] = useState<RgoOverlayResult<string>>();

  const openEditor = async () => {
    const nextResult = await overlays.open(
      OutcomeContent,
      {
        cancelLabel: t("overlayExamples.results.outcomes.cancel"),
        completeLabel: t("overlayExamples.results.outcomes.complete"),
        message: t("overlayExamples.results.outcomes.message"),
        title: t("overlayExamples.results.outcomes.overlayTitle"),
      },
      { presentation: "dialog", maxWidth: "sm" },
    ).result;

    setResult(nextResult);
  };

  const status = result
    ? result.status === "completed"
      ? t("overlayExamples.results.outcomes.completed")
      : t("overlayExamples.results.outcomes.cancelled", {
          reason: result.reason,
        })
    : t("overlayExamples.results.outcomes.idle");

  return (
    <PreviewStatus
      action={
        <Button onClick={() => void openEditor()} variant="contained">
          {t("overlayExamples.results.outcomes.action")}
        </Button>
      }
      status={status}
    />
  );
}

function PreviewStatus({ action, status }: PreviewStatusProps) {
  return (
    <Stack sx={{ alignItems: "center", gap: 2, width: "100%" }}>
      {action}
      <Typography aria-live="polite" color="text.secondary" sx={{ textAlign: "center" }} variant="body2">
        {status}
      </Typography>
    </Stack>
  );
}

function OutcomeContent({ cancelLabel, completeLabel, message, overlay, title }: OutcomeContentProps) {
  return (
    <RgoOverlayFrame
      footer={
        <>
          <Button onClick={() => void overlay.close()}>{cancelLabel}</Button>
          <Button onClick={() => void overlay.complete("saved")} variant="contained">
            {completeLabel}
          </Button>
        </>
      }
      title={title}
    >
      <Typography color="text.secondary" variant="body2">
        {message}
      </Typography>
    </RgoOverlayFrame>
  );
}

type PreviewStatusProps = Readonly<{
  action: ReactNode;
  status: string;
}>;

type OutcomeContentProps = Readonly<{
  cancelLabel: string;
  completeLabel: string;
  message: string;
  title: string;
}> &
  RgoOverlayContentProps<string>;

export function OutcomePreview() {
  return (
    <OverlayExampleWorkspace pageKey="overlay-outcomes-example">
      <OutcomePreviewContent />
    </OverlayExampleWorkspace>
  );
}
