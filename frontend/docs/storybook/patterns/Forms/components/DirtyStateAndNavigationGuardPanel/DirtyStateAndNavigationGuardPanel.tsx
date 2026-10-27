import { ExampleGallery, type ExampleGalleryResources } from "../../../shared/gallery";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { ResetBaselinePreview } from "./ResetBaselinePreview";
import { GuardedDraftPreview } from "./GuardedDraftPreview";
import { NavigationActionsPreview } from "./NavigationActionsPreview";

const resetCode = `const form = useRgoForm({
  defaultValues: initialValues,
  validators: { onDynamic: schema },
  onSubmit: ({ value, formApi }) => {
    const saved = schema.parse(value)
    formApi.reset(saved)
  },
})

<Button onClick={() => form.reset()} type="button">
  {t('draft.reset')}
</Button>`;

const navigationGuardCode = `import { useBlocker } from 'react-router'

const feedback = useRgoFeedback()
const promptRef = React.useRef<AbortController | null>(null)
const blocker = useBlocker(({ currentLocation, nextLocation }) =>
  form.state.isDirty &&
  currentLocation.pathname !== nextLocation.pathname,
)

React.useEffect(() => {
  if (blocker.state !== 'blocked' || promptRef.current) return
  const controller = new AbortController()
  promptRef.current = controller
  void feedback.confirm({
    title: t('draft.discardTitle'),
    message: t('draft.discardMessage'),
    confirmLabel: t('draft.discard'),
    cancelLabel: t('draft.keepEditing'),
    signal: controller.signal,
  }).then((result) => {
    if (controller.signal.aborted) return
    result.status === 'confirmed' ? blocker.proceed() : blocker.reset()
  }).finally(() => {
    if (promptRef.current === controller) promptRef.current = null
  })
  return () => {
    controller.abort()
    if (promptRef.current === controller) promptRef.current = null
  }
}, [blocker, feedback, t])`;

const navigationActionCode = `const navigate = useNavigate()

<Button
  onClick={() => navigate('/dev-guide/frontend/patterns/forms/dependent-fields')}
  type="button"
>
  Open dependent fields
</Button>

// Same-path actions are ignored by the blocker predicate.`;

export function DirtyStateAndNavigationGuardPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("formsExamples.dirty.contents.label"),
      title: t("formsExamples.dirty.contents.title"),
    },
    examples: [
      {
        code: resetCode,
        description: t("formsExamples.dirty.reset.description"),
        id: "forms-dirty-reset",
        sourcePath:
          "docs/storybook/patterns/Forms/components/DirtyStateAndNavigationGuardPanel/ResetBaselinePreview.tsx",
        preview: <ResetBaselinePreview />,
        title: t("formsExamples.dirty.reset.title"),
      },
      {
        code: navigationGuardCode,
        description: t("formsExamples.dirty.guard.description"),
        id: "forms-navigation-guard",
        sourcePath:
          "docs/storybook/patterns/Forms/components/DirtyStateAndNavigationGuardPanel/GuardedDraftPreview.tsx",
        preview: <GuardedDraftPreview />,
        title: t("formsExamples.dirty.guard.title"),
      },
      {
        code: navigationActionCode,
        description: t("formsExamples.dirty.actions.description"),
        id: "forms-guarded-navigation-actions",
        sourcePath:
          "docs/storybook/patterns/Forms/components/DirtyStateAndNavigationGuardPanel/NavigationActionsPreview.tsx",
        preview: <NavigationActionsPreview />,
        title: t("formsExamples.dirty.actions.title"),
      },
    ],
  } satisfies ExampleGalleryResources;

  return <ExampleGallery resources={resources} />;
}
