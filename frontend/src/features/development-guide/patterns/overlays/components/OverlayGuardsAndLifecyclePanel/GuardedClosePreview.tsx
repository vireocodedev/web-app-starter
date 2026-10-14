import { Button, TextField } from "@mui/material";
import { RgoOverlayFrame, useRgoFeedback, useRgoOverlays, type RgoOverlayContentProps } from "@rgo-web/frontend";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { OverlayExampleWorkspace } from "../OverlayExampleWorkspace";

function GuardedClosePreviewContent() {
  const overlays = useRgoOverlays();
  const { t } = useDevelopmentGuideTranslation();

  return (
    <Button
      onClick={() => {
        void overlays.open(
          GuardedEditor,
          {
            cancelLabel: t("overlayExamples.lifecycle.guard.keepEditing"),
            confirmLabel: t("overlayExamples.lifecycle.guard.discard"),
            confirmMessage: t("overlayExamples.lifecycle.guard.confirmMessage"),
            confirmTitle: t("overlayExamples.lifecycle.guard.confirmTitle"),
            fieldLabel: t("overlayExamples.lifecycle.guard.fieldLabel"),
            initialName: t("overlayExamples.lifecycle.guard.initialName"),
            saveLabel: t("overlayExamples.lifecycle.guard.save"),
            title: t("overlayExamples.lifecycle.guard.overlayTitle"),
          },
          { presentation: "dialog", maxWidth: "sm" },
        ).result;
      }}
      variant="contained"
    >
      {t("overlayExamples.lifecycle.guard.action")}
    </Button>
  );
}

function GuardedEditor({
  cancelLabel,
  confirmLabel,
  confirmMessage,
  confirmTitle,
  fieldLabel,
  initialName,
  overlay,
  saveLabel,
  title,
}: GuardedEditorProps) {
  const feedback = useRgoFeedback();
  const [name, setName] = useState(initialName);
  const dirty = name !== initialName;

  return (
    <RgoOverlayFrame
      beforeClose={async ({ signal }) => {
        if (!dirty) return true;
        const result = await feedback.confirm({
          cancelLabel,
          confirmLabel,
          message: confirmMessage,
          signal,
          title: confirmTitle,
        });
        return result.status === "confirmed";
      }}
      footer={
        <Button onClick={() => void overlay.complete(name)} variant="contained">
          {saveLabel}
        </Button>
      }
      title={title}
    >
      <TextField fullWidth label={fieldLabel} onChange={event => setName(event.target.value)} value={name} />
    </RgoOverlayFrame>
  );
}

type GuardedEditorProps = Readonly<{
  cancelLabel: string;
  confirmLabel: string;
  confirmMessage: string;
  confirmTitle: string;
  fieldLabel: string;
  initialName: string;
  saveLabel: string;
  title: string;
}> &
  RgoOverlayContentProps<string>;

export function GuardedClosePreview() {
  return (
    <OverlayExampleWorkspace pageKey="overlay-guard-example">
      <GuardedClosePreviewContent />
    </OverlayExampleWorkspace>
  );
}
