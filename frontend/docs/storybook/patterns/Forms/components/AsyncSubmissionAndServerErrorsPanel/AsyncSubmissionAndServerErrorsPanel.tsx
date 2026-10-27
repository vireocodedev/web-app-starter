import { ExampleGallery, type ExampleGalleryResources } from "../../../shared/gallery";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { PendingSubmissionPreview } from "./PendingSubmissionPreview";
import { ServerErrorsPreview } from "./ServerErrorsPreview";
import { SuccessResetPreview } from "./SuccessResetPreview";

const pendingCode = `import { revalidateLogic } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'

const api = React.useMemo(() => createFormExamplesApi(), [])
const schema = createWorkspaceFormSchema(t)
const saveWorkspace = useMutation({ mutationFn: api.saveWorkspace })
const form = useRgoForm({
  defaultValues,
  validationLogic: revalidateLogic({
    mode: 'submit',
    modeAfterSubmission: 'change',
  }),
  validators: { onDynamic: schema },
  onSubmit: ({ value }) =>
    saveWorkspace.mutateAsync(schema.parse(value)),
})

<form.SubmitButton variant="contained">
  {t('workspace.save')}
</form.SubmitButton>`;

const serverErrorCode = `import { useMutation } from '@tanstack/react-query'

const api = React.useMemo(() => createFormExamplesApi(), [])
const schema = createWorkspaceFormSchema(t)
const saveWorkspace = useMutation({ mutationFn: api.saveWorkspace })
const [serverError, setServerError] = React.useState<string>()

const submit = async (value: WorkspaceFormValue) => {
  try {
    setServerError(undefined)
    await saveWorkspace.mutateAsync(schema.parse(value))
  } catch (error) {
    if (error instanceof FormsSlugConflictError) {
      setServerError(t('workspace.slugConflict'))
    } else if (error instanceof FormsServiceUnavailableError) {
      setServerError(t('workspace.unavailable'))
    } else {
      throw error
    }
  }
}`;

const successResetCode = `const onSubmit = async ({ value, formApi }) => {
  const saved = await saveWorkspace.mutateAsync(
    schema.parse(value),
  )
  const nextDefaultValues = { workspaceName: '', slug: '' }

  setSavedWorkspace(saved)
  formApi.reset(nextDefaultValues)
}`;

export function AsyncSubmissionAndServerErrorsPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("formsExamples.async.contents.label"),
      title: t("formsExamples.async.contents.title"),
    },
    examples: [
      {
        code: pendingCode,
        description: t("formsExamples.async.pending.description"),
        id: "forms-pending-submission",
        sourcePath:
          "docs/storybook/patterns/Forms/components/AsyncSubmissionAndServerErrorsPanel/PendingSubmissionPreview.tsx",
        preview: <PendingSubmissionPreview />,
        title: t("formsExamples.async.pending.title"),
      },
      {
        code: serverErrorCode,
        description: t("formsExamples.async.serverErrors.description"),
        id: "forms-server-errors",
        sourcePath:
          "docs/storybook/patterns/Forms/components/AsyncSubmissionAndServerErrorsPanel/ServerErrorsPreview.tsx",
        preview: <ServerErrorsPreview />,
        title: t("formsExamples.async.serverErrors.title"),
      },
      {
        code: successResetCode,
        description: t("formsExamples.async.reset.description"),
        id: "forms-success-reset",
        sourcePath:
          "docs/storybook/patterns/Forms/components/AsyncSubmissionAndServerErrorsPanel/SuccessResetPreview.tsx",
        preview: <SuccessResetPreview />,
        title: t("formsExamples.async.reset.title"),
      },
    ],
  } satisfies ExampleGalleryResources;

  return <ExampleGallery resources={resources} />;
}
