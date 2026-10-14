import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { CanonicalFiltersPreview } from "./CanonicalFiltersPreview";
import { UrlControlledTablePreview } from "./UrlControlledTablePreview";

const canonicalFiltersCode = `import { useAppQueryParams } from '@/app/router/hooks/useAppQueryParams'
import {
  tableQuerySchema,
  tableUrlStateFromValues,
  type TableFilters,
} from '../../models/TableUrlState'

const { values, setValues } = useAppQueryParams(tableQuerySchema)
const urlState = tableUrlStateFromValues(values)

const updateFilters = (filters: TableFilters) => {
  // One replacement updates both filters and resets the one-based URL page.
  setValues({ ...filters, page: 1 }, { replace: true })
}`;

const controlledTableCode = `import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useAppQueryParams } from '@/app/router/hooks/useAppQueryParams'
import {
  resolveTableUrlPage,
  tableQuerySchema,
  tableUrlStateFromValues,
  tableUrlStateToValues,
} from '../../models/TableUrlState'

const { values, set, setValues } = useAppQueryParams(tableQuerySchema)
const parsedState = useMemo(() => tableUrlStateFromValues(values), [values])
const query = useQuery(projectQueries.page({
  filters: parsedState.filters,
  table: parsedState.table,
}))
const urlState = query.data
  ? resolveTableUrlPage(parsedState, query.data.totalElements)
  : parsedState

useEffect(() => {
  if (urlState !== parsedState) {
    // Correct just the page, preserving unrelated URL parameters.
    set('page', urlState.table.page + 1, { replace: true })
  }
}, [parsedState, set, urlState])

if (!query.data) return null

<RgoDesktopTable
  columns={serverColumns}
  mode="server"
  onStateChange={(table) =>
    setValues(tableUrlStateToValues({ ...urlState, table }))
  }
  pagination={pagination}
  rows={query.data.content}
  state={urlState.table}
  totalCount={query.data.totalElements}
  {...tableLabels}
/>`;

export function UrlBackedFiltersPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("tablesExamples.url.contents.label"),
      title: t("tablesExamples.url.contents.title"),
    },
    examples: [
      {
        code: canonicalFiltersCode,
        description: t("tablesExamples.url.filters.description"),
        id: "table-canonical-url-filters",
        sourcePath:
          "src/features/development-guide/patterns/tablesAndCollections/components/UrlBackedFiltersPanel/CanonicalFiltersPreview.tsx",
        preview: <CanonicalFiltersPreview />,
        title: t("tablesExamples.url.filters.title"),
      },
      {
        code: controlledTableCode,
        description: t("tablesExamples.url.table.description"),
        id: "table-url-controlled-state",
        sourcePath:
          "src/features/development-guide/patterns/tablesAndCollections/components/UrlBackedFiltersPanel/UrlControlledTablePreview.tsx",
        preview: <UrlControlledTablePreview />,
        title: t("tablesExamples.url.table.title"),
      },
    ],
  } satisfies ExampleGalleryResources;

  return <ExampleGallery resources={resources} />;
}
