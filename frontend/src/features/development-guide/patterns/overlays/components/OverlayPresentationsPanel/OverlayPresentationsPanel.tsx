import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

import { CenteredDialogPreview } from "./CenteredDialogPreview";

import { DockedPanelPreview } from "./DockedPanelPreview";

import { ModalPanelPreview } from "./ModalPanelPreview";

const dialogCode = `const overlays = useRgoOverlays()

function ReviewChanges({ overlay }: RgoOverlayContentProps<void>) {
  return (
    <RgoOverlayFrame title={t('review.title')}>
      <ReviewSummary />
    </RgoOverlayFrame>
  )
}

overlays.open(ReviewChanges, {}, {
  presentation: 'dialog',
  maxWidth: 'sm',
})`;

const dockedCode = `const overlays = useRgoOverlays()

overlays.open(ProjectDetails, { projectId }, {
  presentation: 'docked',
  side: 'right',
  width: 360,
  resizable: true,
})`;

const modalPanelCode = `const overlays = useRgoOverlays()

overlays.open(EditFilters, { filters }, {
  presentation: 'modal-panel',
  side: 'right',
  width: 420,
  resizable: true,
})`;

export function OverlayPresentationsPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("overlayExamples.presentations.contents.label"),
      title: t("overlayExamples.presentations.contents.title"),
    },
    examples: [
      {
        code: dialogCode,
        description: t("overlayExamples.presentations.dialog.description"),
        id: "overlay-centered-dialog",
        sourcePath:
          "src/features/development-guide/patterns/overlays/components/OverlayPresentationsPanel/CenteredDialogPreview.tsx",
        preview: <CenteredDialogPreview />,
        title: t("overlayExamples.presentations.dialog.title"),
      },
      {
        code: dockedCode,
        description: t("overlayExamples.presentations.docked.description"),
        id: "overlay-docked-panel",
        sourcePath:
          "src/features/development-guide/patterns/overlays/components/OverlayPresentationsPanel/DockedPanelPreview.tsx",
        preview: <DockedPanelPreview />,
        title: t("overlayExamples.presentations.docked.title"),
      },
      {
        code: modalPanelCode,
        description: t("overlayExamples.presentations.modalPanel.description"),
        id: "overlay-modal-panel",
        sourcePath:
          "src/features/development-guide/patterns/overlays/components/OverlayPresentationsPanel/ModalPanelPreview.tsx",
        preview: <ModalPanelPreview />,
        title: t("overlayExamples.presentations.modalPanel.title"),
      },
    ],
  } satisfies ExampleGalleryResources;
  return <ExampleGallery resources={resources} />;
}
