import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

import { StandardConfirmationPreview } from "./StandardConfirmationPreview";

import { DestructiveConfirmationPreview } from "./DestructiveConfirmationPreview";

import { AbortableConfirmationPreview } from "./AbortableConfirmationPreview";

const standardCode = `const feedback = useRgoFeedback()

const result = await feedback.confirm({
  title: t('publish.title'),
  message: t('publish.message'),
  confirmLabel: t('publish.confirm'),
  cancelLabel: t('publish.cancel'),
})

if (result.status === 'confirmed') {
  await publishChanges()
}`;

const destructiveCode = `const feedback = useRgoFeedback()

const result = await feedback.confirm({
  title: t('delete.title'),
  message: t('delete.message'),
  confirmLabel: t('delete.confirm'),
  cancelLabel: t('delete.cancel'),
  destructive: true,
})

if (result.status !== 'confirmed') return
await deleteProject()`;

const abortableCode = `const feedback = useRgoFeedback()

const result = await feedback.confirm({
  title: t('session.title'),
  message: t('session.message'),
  confirmLabel: t('session.confirm'),
  cancelLabel: t('session.cancel'),
  signal: AbortSignal.timeout(5000),
})

if (result.status === 'cancelled') return
await continueSession()`;

export function ConfirmationDialogsPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("feedback.confirmationExamples.contents.label"),
      title: t("feedback.confirmationExamples.contents.title"),
    },
    examples: [
      {
        code: standardCode,
        description: t("feedback.confirmationExamples.standard.description"),
        id: "confirmation-standard",
        sourcePath:
          "src/features/development-guide/patterns/feedback/components/ConfirmationDialogsPanel/StandardConfirmationPreview.tsx",
        preview: <StandardConfirmationPreview />,
        title: t("feedback.confirmationExamples.standard.title"),
      },
      {
        code: destructiveCode,
        description: t("feedback.confirmationExamples.destructive.description"),
        id: "confirmation-destructive",
        sourcePath:
          "src/features/development-guide/patterns/feedback/components/ConfirmationDialogsPanel/DestructiveConfirmationPreview.tsx",
        preview: <DestructiveConfirmationPreview />,
        title: t("feedback.confirmationExamples.destructive.title"),
      },
      {
        code: abortableCode,
        description: t("feedback.confirmationExamples.abortable.description"),
        id: "confirmation-abortable",
        sourcePath:
          "src/features/development-guide/patterns/feedback/components/ConfirmationDialogsPanel/AbortableConfirmationPreview.tsx",
        preview: <AbortableConfirmationPreview />,
        title: t("feedback.confirmationExamples.abortable.title"),
      },
    ],
  } satisfies ExampleGalleryResources;
  return <ExampleGallery resources={resources} />;
}
