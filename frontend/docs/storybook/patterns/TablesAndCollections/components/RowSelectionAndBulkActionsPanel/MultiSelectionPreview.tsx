import { Box, Checkbox, Stack, Typography } from "@mui/material";
import { RgoDesktopTable, type TableColumnDef } from "@rgo-web/frontend";
import { useMemo, useState } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { tableExampleRecords, type TableExampleRecord } from "../../models/TableExamples";

function TableFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Box sx={{ maxWidth: 840, width: "100%" }}>{children}</Box>;
}

function useDataColumns(): readonly TableColumnDef<TableExampleRecord>[] {
  const { t } = useDevelopmentGuideTranslation();
  return useMemo(
    () => [
      {
        id: "name",
        header: t("tablesExamples.shared.columns.name"),
        renderCell: ({ row }) => row.name,
        rowHeader: true,
      },
      {
        id: "owner",
        header: t("tablesExamples.shared.columns.owner"),
        renderCell: ({ row }) => row.owner,
      },
      {
        id: "status",
        header: t("tablesExamples.shared.columns.status"),
        renderCell: ({ row }) => t(`tablesExamples.shared.status.${row.status}`),
      },
    ],
    [t],
  );
}

function tableLabels(t: ReturnType<typeof useDevelopmentGuideTranslation>["t"]) {
  return {
    emptyContent: t("tablesExamples.shared.empty"),
    getRowKey: (row: TableExampleRecord) => row.id,
    size: "small" as const,
    tableLabel: t("tablesExamples.shared.tableLabel"),
  };
}

function SelectableTable({
  rows,
  selectedIds,
  setSelectedIds,
}: Readonly<{
  rows: readonly TableExampleRecord[];
  selectedIds: ReadonlySet<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}>) {
  const { t } = useDevelopmentGuideTranslation();
  const dataColumns = useDataColumns();
  const selectedVisibleCount = rows.filter(row => selectedIds.has(row.id)).length;
  const allVisibleSelected = rows.length > 0 && selectedVisibleCount === rows.length;
  const columns = useMemo<readonly TableColumnDef<TableExampleRecord>[]>(
    () => [
      {
        align: "center",
        id: "selection",
        header: (
          <Checkbox
            checked={allVisibleSelected}
            indeterminate={selectedVisibleCount > 0 && selectedVisibleCount < rows.length}
            onChange={() =>
              setSelectedIds(current => {
                const next = new Set(current);
                if (allVisibleSelected) rows.forEach(row => next.delete(row.id));
                else rows.forEach(row => next.add(row.id));
                return next;
              })
            }
            size="small"
            slotProps={{
              input: {
                "aria-label": t("tablesExamples.selection.multi.selectAll"),
              },
            }}
          />
        ),
        renderCell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.id)}
            onChange={() =>
              setSelectedIds(current => {
                const next = new Set(current);
                if (next.has(row.id)) next.delete(row.id);
                else next.add(row.id);
                return next;
              })
            }
            size="small"
            slotProps={{
              input: {
                "aria-label": t("tablesExamples.selection.multi.select", {
                  name: row.name,
                }),
              },
            }}
          />
        ),
        width: 64,
      },
      ...dataColumns,
    ],
    [allVisibleSelected, dataColumns, rows, selectedIds, selectedVisibleCount, setSelectedIds, t],
  );

  return <RgoDesktopTable columns={columns} rows={rows} {...tableLabels(t)} />;
}

export function MultiSelectionPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  return (
    <TableFrame>
      <Stack spacing={1.5}>
        <SelectableTable
          rows={tableExampleRecords.slice(0, 4)}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
        />
        <Typography aria-live="polite" color="text.secondary" variant="body2">
          {t("tablesExamples.selection.multi.count", {
            count: selectedIds.size,
          })}
        </Typography>
      </Stack>
    </TableFrame>
  );
}
