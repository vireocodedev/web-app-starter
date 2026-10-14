import { Button, Stack, Typography } from "@mui/material";
import { RgoOverlayFrame, useRgoOverlays, type RgoOverlayContentProps } from "@rgo-web/frontend";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { OverlayExampleWorkspace } from "../OverlayExampleWorkspace";

function CloseAllPreviewContent() {
  const overlays = useRgoOverlays();
  const { t } = useDevelopmentGuideTranslation();
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<LeaveStatus>("idle");

  const openDock = () => {
    const handle = overlays.open(
      PageDock,
      {
        message: t("overlayExamples.lifecycle.closeAll.message"),
        title: t("overlayExamples.lifecycle.closeAll.overlayTitle"),
      },
      { presentation: "docked", side: "right", width: 340 },
    );
    setActive(true);
    setStatus("idle");
    void handle.result.then(() => setActive(false));
  };

  const requestLeave = async () => {
    if (await overlays.closeAll()) setStatus("approved");
  };

  return (
    <Stack
      sx={{
        alignItems: "center",
        gap: 2,
        maxWidth: "100%",
        mx: "auto",
        width: "fit-content",
      }}
    >
      <Stack
        direction="row"
        sx={{
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 1.5,
          maxWidth: "100%",
          mx: "auto",
          width: "fit-content",
        }}
      >
        <Button disabled={active} onClick={openDock} variant="contained">
          {t("overlayExamples.lifecycle.closeAll.openAction")}
        </Button>
        <Button disabled={!active} onClick={() => void requestLeave()} variant="outlined">
          {t("overlayExamples.lifecycle.closeAll.leaveAction")}
        </Button>
      </Stack>
      <Typography aria-live="polite" color="text.secondary" sx={{ textAlign: "center" }} variant="body2">
        {status === "approved"
          ? t("overlayExamples.lifecycle.closeAll.approved")
          : t("overlayExamples.lifecycle.closeAll.idle")}
      </Typography>
    </Stack>
  );
}

function PageDock({ message, title }: PageDockProps) {
  return (
    <RgoOverlayFrame title={title}>
      <Typography color="text.secondary" variant="body2">
        {message}
      </Typography>
    </RgoOverlayFrame>
  );
}

type LeaveStatus = "approved" | "idle";

type PageDockProps = Readonly<{
  message: string;
  title: string;
}> &
  RgoOverlayContentProps<void>;

export function CloseAllPreview() {
  return (
    <OverlayExampleWorkspace pageKey="overlay-close-all-example">
      <CloseAllPreviewContent />
    </OverlayExampleWorkspace>
  );
}
