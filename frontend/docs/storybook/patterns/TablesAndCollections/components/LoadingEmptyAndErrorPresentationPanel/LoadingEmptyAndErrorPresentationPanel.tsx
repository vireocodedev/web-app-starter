import { ExampleGallery, type ExampleGalleryResources } from "../../../shared/gallery";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { InitialLoadingPreview } from "./InitialLoadingPreview";
import { RetainedRefreshPreview } from "./RetainedRefreshPreview";
import { EmptyPreview } from "./EmptyPreview";
import { RecoverableErrorPreview } from "./RecoverableErrorPreview";

const initialLoadingCode = `import { useQuery } from '@tanstack/react-query'

const query = useQuery(projectQueries.list())

<RgoDesktopTable
  columns={columns}
  emptyContent={t('projects.empty')}
  getRowKey={(row) => row.id}
  loading={query.isPending}
  loadingContent={t('projects.loading')}
  loadingLabel={t('projects.loadingLabel')}
  rows={query.data ?? []}
  tableLabel={t('projects.tableLabel')}
/>`;

const retainedRefreshCode = `import { useQuery } from '@tanstack/react-query'

const query = useQuery({
  ...projectQueries.list(),
  placeholderData: (previous) => previous,
})

<RgoDesktopTable
  columns={columns}
  emptyContent={t('projects.empty')}
  getRowKey={(row) => row.id}
  loading={query.isFetching}
  loadingLabel={t('projects.refreshing')}
  rows={query.data ?? []}
  tableLabel={t('projects.tableLabel')}
/>`;

const emptyCode = `if (!query.isSuccess || query.data.length > 0) return null

return (
  <RgoDesktopTable
    columns={columns}
    emptyAction={
      <Button onClick={openCreateProject} variant="contained">
        {t('projects.create')}
      </Button>
    }
    emptyContent={t('projects.empty')}
    getRowKey={(row) => row.id}
    rows={query.data}
    tableLabel={t('projects.tableLabel')}
  />
)`;

const recoverableErrorCode = `{query.isError ? (
  <Alert action={<Button onClick={() => query.refetch()}>{t('retry')}</Button>}>
    {t('projects.loadFailed')}
  </Alert>
) : null}
{query.data ? (
  <RgoDesktopTable
    columns={columns}
    emptyContent={t('projects.empty')}
    getRowKey={(row) => row.id}
    rows={query.data}
    tableLabel={t('projects.tableLabel')}
  />
) : null}`;

export function LoadingEmptyAndErrorPresentationPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("tablesExamples.states.contents.label"),
      title: t("tablesExamples.states.contents.title"),
    },
    examples: [
      {
        code: initialLoadingCode,
        description: t("tablesExamples.states.initial.description"),
        id: "table-initial-loading",
        sourcePath:
          "docs/storybook/patterns/TablesAndCollections/components/LoadingEmptyAndErrorPresentationPanel/InitialLoadingPreview.tsx",
        preview: <InitialLoadingPreview />,
        title: t("tablesExamples.states.initial.title"),
      },
      {
        code: retainedRefreshCode,
        description: t("tablesExamples.states.refresh.description"),
        id: "table-retained-refresh",
        sourcePath:
          "docs/storybook/patterns/TablesAndCollections/components/LoadingEmptyAndErrorPresentationPanel/RetainedRefreshPreview.tsx",
        preview: <RetainedRefreshPreview />,
        title: t("tablesExamples.states.refresh.title"),
      },
      {
        code: emptyCode,
        description: t("tablesExamples.states.empty.description"),
        id: "table-empty-state",
        sourcePath:
          "docs/storybook/patterns/TablesAndCollections/components/LoadingEmptyAndErrorPresentationPanel/EmptyPreview.tsx",
        preview: <EmptyPreview />,
        title: t("tablesExamples.states.empty.title"),
      },
      {
        code: recoverableErrorCode,
        description: t("tablesExamples.states.error.description"),
        id: "table-recoverable-error",
        sourcePath:
          "docs/storybook/patterns/TablesAndCollections/components/LoadingEmptyAndErrorPresentationPanel/RecoverableErrorPreview.tsx",
        preview: <RecoverableErrorPreview />,
        title: t("tablesExamples.states.error.title"),
      },
    ],
  } satisfies ExampleGalleryResources;

  return <ExampleGallery resources={resources} />;
}
