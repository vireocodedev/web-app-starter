import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { RowActivationPreview } from "./RowActivationPreview";
import { MultiSelectionPreview } from "./MultiSelectionPreview";
import { BulkActionPreview } from "./BulkActionPreview";

const rowActivationCode = `const [activeId, setActiveId] = React.useState<string | null>(null)

<RgoDesktopTable
  rowActivation={{
    getRowLabel: ({ row }) => t('projects.open', { name: row.name }),
    onActivate: ({ row }) => setActiveId(row.id),
    selectedRowKey: activeId,
  }}
  {...tableProps}
/>`;

const multiSelectionCode = `const [selectedIds, setSelectedIds] = React.useState(() => new Set<string>())
const visibleIds = rows.map((row) => row.id)
const allVisibleSelected = visibleIds.length > 0 &&
  visibleIds.every((id) => selectedIds.has(id))
const toggleSelection = (id: string) => setSelectedIds((current) => {
  const next = new Set(current)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
})
const toggleVisibleRows = () => setSelectedIds((current) => {
  const next = new Set(current)
  visibleIds.forEach((id) => allVisibleSelected ? next.delete(id) : next.add(id))
  return next
})
const columns = [
  {
    id: 'selection',
    header: (
      <Checkbox
        checked={allVisibleSelected}
        indeterminate={!allVisibleSelected && visibleIds.some((id) => selectedIds.has(id))}
        onChange={toggleVisibleRows}
        slotProps={{ input: { 'aria-label': t('projects.selectAll') } }}
      />
    ),
    renderCell: ({ row }) => (
      <Checkbox
        checked={selectedIds.has(row.id)}
        onChange={() => toggleSelection(row.id)}
        slotProps={{
          input: { 'aria-label': t('projects.select', { name: row.name }) },
        }}
      />
    ),
  },
  ...dataColumns,
]

<RgoDesktopTable columns={columns} {...tableProps} />`;

const bulkActionCode = `const selectedRows = rows.filter((row) => selectedIds.has(row.id))

<Button
  disabled={selectedRows.length === 0}
  onClick={() => archiveProjects(selectedRows.map((row) => row.id))}
>
  {t('projects.archiveSelected', { count: selectedRows.length })}
</Button>
<RgoDesktopTable columns={selectionColumns} rows={rows} {...tableLabels} />`;

export function RowSelectionAndBulkActionsPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("tablesExamples.selection.contents.label"),
      title: t("tablesExamples.selection.contents.title"),
    },
    examples: [
      {
        code: rowActivationCode,
        description: t("tablesExamples.selection.activation.description"),
        id: "table-row-activation",
        sourcePath:
          "src/features/development-guide/patterns/tablesAndCollections/components/RowSelectionAndBulkActionsPanel/RowActivationPreview.tsx",
        preview: <RowActivationPreview />,
        title: t("tablesExamples.selection.activation.title"),
      },
      {
        code: multiSelectionCode,
        description: t("tablesExamples.selection.multi.description"),
        id: "table-multi-selection",
        sourcePath:
          "src/features/development-guide/patterns/tablesAndCollections/components/RowSelectionAndBulkActionsPanel/MultiSelectionPreview.tsx",
        preview: <MultiSelectionPreview />,
        title: t("tablesExamples.selection.multi.title"),
      },
      {
        code: bulkActionCode,
        description: t("tablesExamples.selection.bulk.description"),
        id: "table-bulk-action",
        sourcePath:
          "src/features/development-guide/patterns/tablesAndCollections/components/RowSelectionAndBulkActionsPanel/BulkActionPreview.tsx",
        preview: <BulkActionPreview />,
        title: t("tablesExamples.selection.bulk.title"),
      },
    ],
  } satisfies ExampleGalleryResources;

  return <ExampleGallery resources={resources} />;
}
