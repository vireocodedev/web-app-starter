import { Box, Button, Checkbox, Stack } from "@mui/material";
import { RgoDesktopTable, type TableColumnDef } from "@rgo-web/frontend";
import { useMemo, useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
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

export function BulkActionPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const [rows, setRows] = useState(tableExampleRecords.slice(0, 4));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(["atlas", "beacon"]));

  return (
    <TableFrame>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
          <Button
            disabled={selectedIds.size === 0}
            onClick={() => {
              setRows(current => current.filter(row => !selectedIds.has(row.id)));
              setSelectedIds(new Set());
            }}
            variant="contained"
          >
            {t("tablesExamples.selection.bulk.action", {
              count: selectedIds.size,
            })}
          </Button>
        </Stack>
        <SelectableTable rows={rows} selectedIds={selectedIds} setSelectedIds={setSelectedIds} />
      </Stack>
    </TableFrame>
  );
}
