import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import PendingOutlinedIcon from "@mui/icons-material/PendingOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import {
  RgoOverlayFrame,
  useRgoOverlays,
  type RgoOverlayCancellationReason,
  type RgoOverlayContentProps,
} from "@rgo-web/frontend";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { OverlayExampleWorkspace } from "../OverlayExampleWorkspace";

function CancellationReasonPreviewContent() {
  const overlays = useRgoOverlays();
  const { t } = useDevelopmentGuideTranslation();
  const [firstActive, setFirstActive] = useState(false);
  const [reason, setReason] = useState<RgoOverlayCancellationReason>();

  const openFirst = () => {
    const handle = overlays.open(
      OriginalDock,
      {
        message: t("overlayExamples.lifecycle.reasons.firstMessage"),
        title: t("overlayExamples.lifecycle.reasons.firstTitle"),
      },
      { presentation: "docked", side: "right", width: 340 },
    );
    setFirstActive(true);
    setReason(undefined);
    void handle.result.then(result => {
      setFirstActive(false);
      if (result.status === "cancelled") setReason(result.reason);
    });
  };

  const replaceFirst = () => {
    void overlays.open(
      ReplacementDock,
      {
        message: t("overlayExamples.lifecycle.reasons.replacementMessage"),
        title: t("overlayExamples.lifecycle.reasons.replacementTitle"),
      },
      { presentation: "docked", side: "right", width: 340 },
    ).result;
  };

  const statusLabel = reason
    ? t("overlayExamples.lifecycle.reasons.result", { reason })
    : t("overlayExamples.lifecycle.reasons.idle");
  const StatusIcon = reason
    ? reason === "replaced"
      ? SwapHorizOutlinedIcon
      : reason === "dismissed"
        ? CloseOutlinedIcon
        : InfoOutlinedIcon
    : PendingOutlinedIcon;
  const statusColor = reason
    ? reason === "replaced"
      ? "info.main"
      : reason === "dismissed"
        ? "warning.main"
        : "text.secondary"
    : "text.disabled";

  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "nowrap",
        gap: 1.5,
        width: "100%",
      }}
    >
      <Tooltip title={t("overlayExamples.lifecycle.reasons.openAction")}>
        <span>
          <IconButton
            aria-label={t("overlayExamples.lifecycle.reasons.openAction")}
            color="primary"
            disabled={firstActive}
            onClick={openFirst}
            sx={{ flexShrink: 0 }}
          >
            <OpenInNewOutlinedIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t("overlayExamples.lifecycle.reasons.replaceAction")}>
        <span>
          <IconButton
            aria-label={t("overlayExamples.lifecycle.reasons.replaceAction")}
            color="secondary"
            disabled={!firstActive}
            onClick={replaceFirst}
            sx={{ flexShrink: 0 }}
          >
            <SwapHorizOutlinedIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={statusLabel}>
        <Box
          aria-label={statusLabel}
          aria-live="polite"
          component="span"
          role="status"
          sx={{
            alignItems: "center",
            color: statusColor,
            display: "inline-flex",
            flex: "0 0 44px",
            height: 44,
            justifyContent: "center",
            width: 44,
          }}
        >
          <StatusIcon aria-hidden="true" />
        </Box>
      </Tooltip>
    </Stack>
  );
}

function OriginalDock({ message, title }: ReasonDockProps) {
  return (
    <RgoOverlayFrame title={title}>
      <Typography color="text.secondary" variant="body2">
        {message}
      </Typography>
    </RgoOverlayFrame>
  );
}

function ReplacementDock({ message, title }: ReasonDockProps) {
  return (
    <RgoOverlayFrame title={title}>
      <Typography color="text.secondary" variant="body2">
        {message}
      </Typography>
    </RgoOverlayFrame>
  );
}

type ReasonDockProps = Readonly<{
  message: string;
  title: string;
}> &
  RgoOverlayContentProps<void>;

export function CancellationReasonPreview() {
  return (
    <OverlayExampleWorkspace pageKey="overlay-reasons-example">
      <CancellationReasonPreviewContent />
    </OverlayExampleWorkspace>
  );
}
