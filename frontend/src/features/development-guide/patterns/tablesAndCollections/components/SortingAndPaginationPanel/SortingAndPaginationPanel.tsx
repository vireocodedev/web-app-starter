import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { LocalSortingPreview } from "./LocalSortingPreview";
import { LocalPaginationPreview } from "./LocalPaginationPreview";
import { ControlledServerPreview } from "./ControlledServerPreview";

const localSortingCode = `const columns: readonly TableColumnDef<Project>[] = [{
  id: 'name',
  header: t('projects.columns.name'),
  renderCell: ({ row }) => row.name,
  sort: { compare: (a, b) => a.name.localeCompare(b.name) },
}]

<RgoDesktopTable columns={columns} rows={projects} {...tableLabels} />`;

const localPaginationCode = `<RgoDesktopTable
  columns={columns}
  defaultState={{ rowsPerPage: 2 }}
  pagination={{
    getItemAriaLabel: (type) => t(\`pagination.\${type}\`),
    labelDisplayedRows: ({ from, to, count }) =>
      t('pagination.displayed', { from, to, count }),
    labelRowsPerPage: t('projects.rowsPerPage'),
    rowsPerPageOptions: [2, 4, 6],
  }}
  rows={projects}
  {...tableLabels}
/>`;

const controlledServerCode = `import { useQuery } from '@tanstack/react-query'

const [state, setState] = React.useState<RgoDesktopTableState>({
  page: 0,
  rowsPerPage: 20,
  sort: null,
})
const serverColumns = columns.map((column) => ({
  ...column,
  sort: { serverField: column.id },
}))
const query = useQuery(projectQueries.page(state))

<RgoDesktopTable
  columns={serverColumns}
  mode="server"
  onStateChange={setState}
  pagination={pagination}
  rows={query.data?.content ?? []}
  state={state}
  totalCount={query.data?.totalElements ?? 0}
  {...tableLabels}
/>`;

export function SortingAndPaginationPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("tablesExamples.sorting.contents.label"),
      title: t("tablesExamples.sorting.contents.title"),
    },
    examples: [
      {
        code: localSortingCode,
        description: t("tablesExamples.sorting.local.description"),
        id: "table-local-sorting",
        sourcePath:
          "src/features/development-guide/patterns/tablesAndCollections/components/SortingAndPaginationPanel/LocalSortingPreview.tsx",
        preview: <LocalSortingPreview />,
        title: t("tablesExamples.sorting.local.title"),
      },
      {
        code: localPaginationCode,
        description: t("tablesExamples.sorting.pagination.description"),
        id: "table-local-pagination",
        sourcePath:
          "src/features/development-guide/patterns/tablesAndCollections/components/SortingAndPaginationPanel/LocalPaginationPreview.tsx",
        preview: <LocalPaginationPreview />,
        title: t("tablesExamples.sorting.pagination.title"),
      },
      {
        code: controlledServerCode,
        description: t("tablesExamples.sorting.server.description"),
        id: "table-controlled-server-state",
        sourcePath:
          "src/features/development-guide/patterns/tablesAndCollections/components/SortingAndPaginationPanel/ControlledServerPreview.tsx",
        preview: <ControlledServerPreview />,
        title: t("tablesExamples.sorting.server.title"),
      },
    ],
  } satisfies ExampleGalleryResources;

  return <ExampleGallery resources={resources} />;
}
