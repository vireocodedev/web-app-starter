import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { LoadingStatePreview } from "./LoadingStatePreview";
import { ErrorStatePreview } from "./ErrorStatePreview";
import { EmptyStatePreview } from "./EmptyStatePreview";
import { SuccessStatePreview } from "./SuccessStatePreview";

const loadingCode = `import { useQuery } from '@tanstack/react-query'

const api = createServerDataExampleApi()
const ServerDataQuery = createServerDataExampleQuery(api)
const query = useQuery(ServerDataQuery.list())

if (query.isPending) return <CircularProgress aria-label={t('loading')} />`;

const errorCode = `import { useQuery } from '@tanstack/react-query'

const api = createServerDataExampleApi()
const ServerDataQuery = createServerDataExampleQuery(api)
const query = useQuery(ServerDataQuery.list())

if (query.isError) {
  return <ErrorState onRetry={() => query.refetch()} />
}`;

const emptyCode = `import { useQuery } from '@tanstack/react-query'

const api = createServerDataExampleApi()
const ServerDataQuery = createServerDataExampleQuery(api)
const query = useQuery(ServerDataQuery.list())

if (query.data?.items.length === 0) {
  return <EmptyState />
}`;

const successCode = `import { useQuery } from '@tanstack/react-query'

const api = createServerDataExampleApi()
const ServerDataQuery = createServerDataExampleQuery(api)
const query = useQuery(ServerDataQuery.list())

if (query.data) {
  return <RecordList records={query.data.items} />
}`;

export function QueryStatesPanel() {
  const { t } = useDevelopmentGuideTranslation();

  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("serverDataExamples.queryStates.contents.label"),
      title: t("serverDataExamples.queryStates.contents.title"),
    },
    examples: [
      {
        code: loadingCode,
        description: t("serverDataExamples.queryStates.loading.description"),
        id: "server-data-loading-state",
        sourcePath:
          "src/features/development-guide/patterns/serverData/components/QueryStatesPanel/LoadingStatePreview.tsx",
        preview: <LoadingStatePreview />,
        title: t("serverDataExamples.queryStates.loading.title"),
      },
      {
        code: errorCode,
        description: t("serverDataExamples.queryStates.error.description"),
        id: "server-data-error-state",
        sourcePath:
          "src/features/development-guide/patterns/serverData/components/QueryStatesPanel/ErrorStatePreview.tsx",
        preview: <ErrorStatePreview />,
        title: t("serverDataExamples.queryStates.error.title"),
      },
      {
        code: emptyCode,
        description: t("serverDataExamples.queryStates.empty.description"),
        id: "server-data-empty-state",
        sourcePath:
          "src/features/development-guide/patterns/serverData/components/QueryStatesPanel/EmptyStatePreview.tsx",
        preview: <EmptyStatePreview />,
        title: t("serverDataExamples.queryStates.empty.title"),
      },
      {
        code: successCode,
        description: t("serverDataExamples.queryStates.success.description"),
        id: "server-data-success-state",
        sourcePath:
          "src/features/development-guide/patterns/serverData/components/QueryStatesPanel/SuccessStatePreview.tsx",
        preview: <SuccessStatePreview />,
        title: t("serverDataExamples.queryStates.success.title"),
      },
    ],
  } satisfies ExampleGalleryResources;

  return <ExampleGallery resources={resources} />;
}
