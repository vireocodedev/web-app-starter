import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

import { GuardedClosePreview } from "./GuardedClosePreview";

import { BusyStatePreview } from "./BusyStatePreview";

import { CloseAllPreview } from "./CloseAllPreview";

import { CancellationReasonPreview } from "./CancellationReasonPreview";

const guardedCloseCode = `const feedback = useRgoFeedback()
const [dirty, setDirty] = React.useState(false)

const beforeClose: RgoOverlayBeforeClose = async ({ signal }) => {
  if (!dirty) return true
  const result = await feedback.confirm({
    title: t('discard.title'),
    message: t('discard.message'),
    confirmLabel: t('discard.confirm'),
    cancelLabel: t('discard.cancel'),
    signal,
  })
  return result.status === 'confirmed'
}

<RgoOverlayFrame
  beforeClose={beforeClose}
  title={t('editor.title')}
>
  <EditorForm onDirtyChange={setDirty} />
</RgoOverlayFrame>`;

const busyCode = `const [saving, setSaving] = React.useState(false)

return (
  <RgoOverlayFrame busy={saving} title={t('editor.title')}>
    <EditorForm />
  </RgoOverlayFrame>
)`;

const closeAllCode = `import { useNavigate } from 'react-router'

const overlays = useRgoOverlays()
const navigate = useNavigate()

const leavePage = async (to: string) => {
  if (await overlays.closeAll()) navigate(to)
}`;

const cancellationCode = `const overlays = useRgoOverlays()
const [reason, setReason] = React.useState<string>()
const result = await overlays.open(Editor, {}, {
  presentation: 'docked',
}).result

if (result.status === 'cancelled') {
  setReason(result.reason)
}`;

export function OverlayGuardsAndLifecyclePanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("overlayExamples.lifecycle.contents.label"),
      title: t("overlayExamples.lifecycle.contents.title"),
    },
    examples: [
      {
        code: guardedCloseCode,
        description: t("overlayExamples.lifecycle.guard.description"),
        id: "overlay-unsaved-guard",
        sourcePath:
          "src/features/development-guide/patterns/overlays/components/OverlayGuardsAndLifecyclePanel/GuardedClosePreview.tsx",
        preview: <GuardedClosePreview />,
        title: t("overlayExamples.lifecycle.guard.title"),
      },
      {
        code: busyCode,
        description: t("overlayExamples.lifecycle.busy.description"),
        id: "overlay-busy-state",
        sourcePath:
          "src/features/development-guide/patterns/overlays/components/OverlayGuardsAndLifecyclePanel/BusyStatePreview.tsx",
        preview: <BusyStatePreview />,
        title: t("overlayExamples.lifecycle.busy.title"),
      },
      {
        code: closeAllCode,
        description: t("overlayExamples.lifecycle.closeAll.description"),
        id: "overlay-close-all",
        sourcePath:
          "src/features/development-guide/patterns/overlays/components/OverlayGuardsAndLifecyclePanel/CloseAllPreview.tsx",
        preview: <CloseAllPreview />,
        title: t("overlayExamples.lifecycle.closeAll.title"),
      },
      {
        code: cancellationCode,
        description: t("overlayExamples.lifecycle.reasons.description"),
        id: "overlay-cancellation-reasons",
        sourcePath:
          "src/features/development-guide/patterns/overlays/components/OverlayGuardsAndLifecyclePanel/CancellationReasonPreview.tsx",
        preview: <CancellationReasonPreview />,
        title: t("overlayExamples.lifecycle.reasons.title"),
      },
    ],
  } satisfies ExampleGalleryResources;
  return <ExampleGallery resources={resources} />;
}
