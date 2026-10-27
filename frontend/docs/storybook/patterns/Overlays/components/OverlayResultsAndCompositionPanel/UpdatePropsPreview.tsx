import { Button, Stack, Typography } from "@mui/material";
import { RgoOverlayFrame, useRgoOverlays, type RgoOverlayContentProps, type RgoOverlayHandle } from "@rgo-web/frontend";
import { useRef, useState } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { OverlayExampleWorkspace } from "../OverlayExampleWorkspace";

function UpdatePropsPreviewContent() {
  const overlays = useRgoOverlays();
  const { t } = useDevelopmentGuideTranslation();
  const [active, setActive] = useState(false);
  const [revision, setRevision] = useState(1);
  const handleRef = useRef<RgoOverlayHandle<
    Omit<RevisionContentProps, keyof RgoOverlayContentProps<void>>,
    void
  > | null>(null);

  const openDetails = () => {
    const handle = overlays.open(
      RevisionContent,
      {
        completeLabel: t("overlayExamples.complete"),
        message: t("overlayExamples.results.updates.message"),
        revision,
        revisionLabel: t("overlayExamples.results.updates.revisionLabel"),
        title: t("overlayExamples.results.updates.overlayTitle"),
      },
      {
        presentation: "docked",
        resizable: true,
        side: "right",
        width: 340,
      },
    );
    handleRef.current = handle;
    setActive(true);
    void handle.result.then(() => setActive(false));
  };

  const updateDetails = () => {
    setRevision(current => {
      const next = current + 1;
      handleRef.current?.updateProps({ revision: next });
      return next;
    });
  };

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 1.5,
        maxWidth: "100%",
        mx: "auto",
        width: "fit-content",
      }}
    >
      <Button disabled={active} onClick={openDetails} variant="contained">
        {t("overlayExamples.results.updates.openAction")}
      </Button>
      <Button disabled={!active} onClick={updateDetails} variant="outlined">
        {t("overlayExamples.results.updates.updateAction")}
      </Button>
    </Stack>
  );
}

type RevisionContentProps = Readonly<{
  completeLabel: string;
  message: string;
  revision: number;
  revisionLabel: string;
  title: string;
}> &
  RgoOverlayContentProps<void>;

function RevisionContent({ completeLabel, message, overlay, revision, revisionLabel, title }: RevisionContentProps) {
  return (
    <RgoOverlayFrame
      footer={
        <Button onClick={() => void overlay.complete(undefined)} variant="contained">
          {completeLabel}
        </Button>
      }
      title={title}
    >
      <Stack spacing={1}>
        <Typography color="text.secondary" variant="body2">
          {message}
        </Typography>
        <Typography sx={{ fontWeight: 700 }}>
          {revisionLabel} {revision}
        </Typography>
      </Stack>
    </RgoOverlayFrame>
  );
}

export function UpdatePropsPreview() {
  return (
    <OverlayExampleWorkspace pageKey="overlay-update-props-example">
      <UpdatePropsPreviewContent />
    </OverlayExampleWorkspace>
  );
}
