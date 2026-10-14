import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { FilteringPreview } from "./FilteringPreview";
import { PaginationPreview } from "./PaginationPreview";
import { QueryKeyPreview } from "./QueryKeyPreview";

const filteringCode = `import { useQuery } from '@tanstack/react-query'

const api = createServerDataExampleApi()
const ServerDataQuery = createServerDataExampleQuery(api)
const [search, setSearch] = React.useState('')
const filters = { page: 1, pageSize: 3, search }
const records = useQuery(ServerDataQuery.list(filters))

<TextField
  label={t('filters.search')}
  onChange={(event) => setSearch(event.target.value)}
  value={search}
/>`;

const paginationCode = `import { keepPreviousData, useQuery } from '@tanstack/react-query'

const api = createServerDataExampleApi()
const ServerDataQuery = createServerDataExampleQuery(api)
const [page, setPage] = React.useState(1)
const records = useQuery({
  ...ServerDataQuery.list({ page, pageSize: 2 }),
  placeholderData: keepPreviousData,
})

<Pagination page={page} onChange={(_, value) => setPage(value)} />`;

const queryKeyCode = `const QueryKey = {
  collections: () => ['records', 'collection'] as const,
  list: (filters: RecordFilters) =>
    [...QueryKey.collections(), 'list', normalizeRecordFilters(filters)] as const,
}`;

export function PaginationAndFilteringPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("serverDataExamples.pagination.contents.label"),
      title: t("serverDataExamples.pagination.contents.title"),
    },
    examples: [
      {
        code: filteringCode,
        description: t("serverDataExamples.pagination.filtering.description"),
        id: "server-data-filtering",
        sourcePath:
          "src/features/development-guide/patterns/serverData/components/PaginationAndFilteringPanel/FilteringPreview.tsx",
        preview: <FilteringPreview />,
        title: t("serverDataExamples.pagination.filtering.title"),
      },
      {
        code: paginationCode,
        description: t("serverDataExamples.pagination.paging.description"),
        id: "server-data-pagination",
        sourcePath:
          "src/features/development-guide/patterns/serverData/components/PaginationAndFilteringPanel/PaginationPreview.tsx",
        preview: <PaginationPreview />,
        title: t("serverDataExamples.pagination.paging.title"),
      },
      {
        code: queryKeyCode,
        description: t("serverDataExamples.pagination.key.description"),
        id: "server-data-query-key",
        sourcePath:
          "src/features/development-guide/patterns/serverData/components/PaginationAndFilteringPanel/QueryKeyPreview.tsx",
        preview: <QueryKeyPreview />,
        title: t("serverDataExamples.pagination.key.title"),
      },
    ],
  } satisfies ExampleGalleryResources;

  return <ExampleGallery resources={resources} />;
}
