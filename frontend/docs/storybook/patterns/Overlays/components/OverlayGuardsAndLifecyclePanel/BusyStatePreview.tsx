import { Button, Typography } from "@mui/material";
import { RgoOverlayFrame, useRgoOverlays, type RgoOverlayContentProps } from "@rgo-web/frontend";
import { useEffect, useRef, useState } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { OverlayExampleWorkspace } from "../OverlayExampleWorkspace";

function BusyStatePreviewContent() {
  const overlays = useRgoOverlays();
  const { t } = useDevelopmentGuideTranslation();

  return (
    <Button
      onClick={() => {
        void overlays.open(
          BusyEditor,
          {
            completeLabel: t("overlayExamples.complete"),
            idleMessage: t("overlayExamples.lifecycle.busy.idleMessage"),
            saveLabel: t("overlayExamples.lifecycle.busy.save"),
            savedMessage: t("overlayExamples.lifecycle.busy.savedMessage"),
            savingLabel: t("overlayExamples.lifecycle.busy.saving"),
            savingMessage: t("overlayExamples.lifecycle.busy.savingMessage"),
            title: t("overlayExamples.lifecycle.busy.overlayTitle"),
          },
          { presentation: "dialog", maxWidth: "sm" },
        ).result;
      }}
      variant="contained"
    >
      {t("overlayExamples.lifecycle.busy.action")}
    </Button>
  );
}

function BusyEditor({
  completeLabel,
  idleMessage,
  overlay,
  saveLabel,
  savedMessage,
  savingLabel,
  savingMessage,
  title,
}: BusyEditorProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(idleMessage);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const simulateSave = () => {
    setBusy(true);
    setMessage(savingMessage);
    timeoutRef.current = window.setTimeout(() => {
      setBusy(false);
      setMessage(savedMessage);
    }, 2000);
  };

  return (
    <RgoOverlayFrame
      busy={busy}
      footer={
        <>
          <Button disabled={busy} onClick={simulateSave} variant="outlined">
            {busy ? savingLabel : saveLabel}
          </Button>
          <Button disabled={busy} onClick={() => void overlay.complete(undefined)} variant="contained">
            {completeLabel}
          </Button>
        </>
      }
      title={title}
    >
      <Typography aria-live="polite" color="text.secondary" variant="body2">
        {message}
      </Typography>
    </RgoOverlayFrame>
  );
}

type BusyEditorProps = Readonly<{
  completeLabel: string;
  idleMessage: string;
  saveLabel: string;
  savedMessage: string;
  savingLabel: string;
  savingMessage: string;
  title: string;
}> &
  RgoOverlayContentProps<void>;

export function BusyStatePreview() {
  return (
    <OverlayExampleWorkspace pageKey="overlay-busy-example">
      <BusyStatePreviewContent />
    </OverlayExampleWorkspace>
  );
}
