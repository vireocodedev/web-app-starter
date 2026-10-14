import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

import { SuccessNotificationPreview } from "./SuccessNotificationPreview";

import { ActionNotificationPreview } from "./ActionNotificationPreview";

import { PersistentNotificationPreview } from "./PersistentNotificationPreview";

import { ErrorNotificationPreview } from "./ErrorNotificationPreview";

import { ReplacementNotificationPreview } from "./ReplacementNotificationPreview";

import { ToastPositionPreview } from "./ToastPositionPreview";

const successCode = `const feedback = useRgoFeedback()

feedback.notify({
  id: 'project-created',
  message: t('feedback.projectCreated'),
  severity: 'success',
})`;

const actionCode = `const feedback = useRgoFeedback()

feedback.notify({
  id: 'project-archived',
  message: t('feedback.projectArchived'),
  severity: 'info',
  action: {
    label: t('actions.undo'),
    onClick: () => restoreProject(),
  },
})`;

const persistentCode = `const feedback = useRgoFeedback()
const id = 'maintenance-warning'

feedback.notify({
  id,
  message: t('feedback.maintenanceSoon'),
  severity: 'warning',
  durationMs: null,
})

feedback.dismiss(id)`;

const errorCode = `const feedback = useRgoFeedback()

feedback.notify({
  id: 'export-failed',
  message: t('feedback.exportFailed'),
  severity: 'error',
})`;

const replacementCode = `const feedback = useRgoFeedback()
const id = 'sync-status'

feedback.notify({
  id,
  message: t('feedback.syncStarted'),
  severity: 'info',
})

// Reusing the ID replaces the current toast.
feedback.notify({
  id,
  message: t('feedback.syncComplete'),
  severity: 'success',
})`;

const positionCode = `<RgoFeedbackProvider
  notificationCloseLabel={t('feedback.closeNotification')}
  slotProps={{
    notification: {
      anchorOrigin: {
        horizontal: 'right',
        vertical: 'top',
      },
    },
  }}
>
  <App />
</RgoFeedbackProvider>`;

export function ToastNotificationsPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("feedback.examples.contents.label"),
      title: t("feedback.examples.contents.title"),
    },
    examples: [
      {
        code: successCode,
        description: t("feedback.examples.success.description"),
        id: "toast-success",
        sourcePath:
          "src/features/development-guide/patterns/feedback/components/ToastNotificationsPanel/SuccessNotificationPreview.tsx",
        preview: <SuccessNotificationPreview />,
        title: t("feedback.examples.success.title"),
      },
      {
        code: actionCode,
        description: t("feedback.examples.action.description"),
        id: "toast-action",
        sourcePath:
          "src/features/development-guide/patterns/feedback/components/ToastNotificationsPanel/ActionNotificationPreview.tsx",
        preview: <ActionNotificationPreview />,
        title: t("feedback.examples.action.title"),
      },
      {
        code: persistentCode,
        description: t("feedback.examples.persistent.description"),
        id: "toast-persistent",
        sourcePath:
          "src/features/development-guide/patterns/feedback/components/ToastNotificationsPanel/PersistentNotificationPreview.tsx",
        preview: <PersistentNotificationPreview />,
        title: t("feedback.examples.persistent.title"),
      },
      {
        code: errorCode,
        description: t("feedback.examples.error.description"),
        id: "toast-error",
        sourcePath:
          "src/features/development-guide/patterns/feedback/components/ToastNotificationsPanel/ErrorNotificationPreview.tsx",
        preview: <ErrorNotificationPreview />,
        title: t("feedback.examples.error.title"),
      },
      {
        code: replacementCode,
        description: t("feedback.examples.replacement.description"),
        id: "toast-replacement",
        sourcePath:
          "src/features/development-guide/patterns/feedback/components/ToastNotificationsPanel/ReplacementNotificationPreview.tsx",
        preview: <ReplacementNotificationPreview />,
        title: t("feedback.examples.replacement.title"),
      },
      {
        code: positionCode,
        description: t("feedback.examples.position.description"),
        id: "toast-position",
        sourcePath:
          "src/features/development-guide/patterns/feedback/components/ToastNotificationsPanel/ToastPositionPreview.tsx",
        preview: <ToastPositionPreview />,
        title: t("feedback.examples.position.title"),
      },
    ],
  } satisfies ExampleGalleryResources;
  return <ExampleGallery resources={resources} />;
}
