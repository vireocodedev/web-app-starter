import { Button, Stack, Typography } from "@mui/material";
import { RgoOverlayFrame, useRgoOverlays, type RgoOverlayContentProps, type RgoOverlayResult } from "@rgo-web/frontend";
import { useState, type ReactNode } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { OverlayExampleWorkspace } from "../OverlayExampleWorkspace";

function TypedResultPreviewContent() {
  const overlays = useRgoOverlays();
  const { t } = useDevelopmentGuideTranslation();
  const [result, setResult] = useState<RgoOverlayResult<ProjectChoice>>();
  const project = {
    id: "RGO-42",
    name: t("overlayExamples.results.typed.projectName"),
  };

  const openPicker = async () => {
    const nextResult = await overlays.open(
      ProjectPicker,
      {
        chooseLabel: t("overlayExamples.results.typed.choose"),
        message: t("overlayExamples.results.typed.message", {
          project: project.name,
        }),
        project,
        title: t("overlayExamples.results.typed.overlayTitle"),
      },
      { presentation: "dialog", maxWidth: "sm" },
    ).result;

    setResult(nextResult);
  };

  const status = result
    ? result.status === "completed"
      ? t("overlayExamples.results.typed.completed", result.value)
      : t("overlayExamples.results.typed.cancelled")
    : t("overlayExamples.results.typed.idle");

  return (
    <PreviewStatus
      action={
        <Button onClick={() => void openPicker()} variant="contained">
          {t("overlayExamples.results.typed.action")}
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

type ProjectChoice = Readonly<{ id: string; name: string }>;

function ProjectPicker({ chooseLabel, message, overlay, project, title }: ProjectPickerProps) {
  return (
    <RgoOverlayFrame
      footer={
        <Button onClick={() => void overlay.complete(project)} variant="contained">
          {chooseLabel}
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

type PreviewStatusProps = Readonly<{
  action: ReactNode;
  status: string;
}>;

type ProjectPickerProps = Readonly<{
  chooseLabel: string;
  message: string;
  project: ProjectChoice;
  title: string;
}> &
  RgoOverlayContentProps<ProjectChoice>;

export function TypedResultPreview() {
  return (
    <OverlayExampleWorkspace pageKey="overlay-typed-result-example">
      <TypedResultPreviewContent />
    </OverlayExampleWorkspace>
  );
}
