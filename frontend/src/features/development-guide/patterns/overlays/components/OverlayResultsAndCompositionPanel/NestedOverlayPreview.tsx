import { Button, Stack, Typography } from "@mui/material";
import { RgoOverlayFrame, useRgoOverlays, type RgoOverlayContentProps } from "@rgo-web/frontend";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { OverlayExampleWorkspace } from "../OverlayExampleWorkspace";

function NestedOverlayPreviewContent() {
  const overlays = useRgoOverlays();
  const { t } = useDevelopmentGuideTranslation();

  return (
    <Button
      onClick={() => {
        void overlays.open(
          ParentEditor,
          {
            childAction: t("overlayExamples.results.nested.childAction"),
            childChoose: t("overlayExamples.results.nested.childChoose"),
            childMessage: t("overlayExamples.results.nested.childMessage"),
            childTitle: t("overlayExamples.results.nested.childTitle"),
            completeLabel: t("overlayExamples.complete"),
            customer: t("overlayExamples.results.nested.customer"),
            message: t("overlayExamples.results.nested.message"),
            noneSelected: t("overlayExamples.results.nested.noneSelected"),
            selectedLabel: t("overlayExamples.results.nested.selectedLabel"),
            title: t("overlayExamples.results.nested.overlayTitle"),
          },
          { presentation: "dialog", maxWidth: "sm" },
        ).result;
      }}
      variant="contained"
    >
      {t("overlayExamples.results.nested.action")}
    </Button>
  );
}

function ParentEditor({
  childAction,
  childChoose,
  childMessage,
  childTitle,
  completeLabel,
  customer,
  message,
  noneSelected,
  overlay,
  selectedLabel,
  title,
}: ParentEditorProps) {
  const overlays = useRgoOverlays();
  const [selected, setSelected] = useState<string>();

  const openPicker = async () => {
    const result = await overlays.open(
      CustomerPicker,
      {
        chooseLabel: childChoose,
        customer,
        message: childMessage,
        title: childTitle,
      },
      { presentation: "dialog", maxWidth: "xs" },
    ).result;
    if (result.status === "completed") setSelected(result.value);
  };

  return (
    <RgoOverlayFrame
      footer={
        <Button onClick={() => void overlay.complete(undefined)} variant="contained">
          {completeLabel}
        </Button>
      }
      title={title}
    >
      <Stack spacing={2}>
        <Typography color="text.secondary" variant="body2">
          {message}
        </Typography>
        <Typography variant="body2">{selected ? `${selectedLabel}: ${selected}` : noneSelected}</Typography>
        <Button onClick={() => void openPicker()} variant="outlined">
          {childAction}
        </Button>
      </Stack>
    </RgoOverlayFrame>
  );
}

function CustomerPicker({ chooseLabel, customer, message, overlay, title }: CustomerPickerProps) {
  return (
    <RgoOverlayFrame
      footer={
        <Button onClick={() => void overlay.complete(customer)} variant="contained">
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

type ParentEditorProps = Readonly<{
  childAction: string;
  childChoose: string;
  childMessage: string;
  childTitle: string;
  completeLabel: string;
  customer: string;
  message: string;
  noneSelected: string;
  selectedLabel: string;
  title: string;
}> &
  RgoOverlayContentProps<void>;

type CustomerPickerProps = Readonly<{
  chooseLabel: string;
  customer: string;
  message: string;
  title: string;
}> &
  RgoOverlayContentProps<string>;

export function NestedOverlayPreview() {
  return (
    <OverlayExampleWorkspace pageKey="overlay-nested-example">
      <NestedOverlayPreviewContent />
    </OverlayExampleWorkspace>
  );
}
