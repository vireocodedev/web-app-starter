import { Box } from "@mui/material";
import { RgoDesktopTable, type RgoDesktopTableState, type TableColumnDef } from "@rgo-web/frontend";
import { useMemo, useState } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { tableExampleRecords, type TableExampleRecord } from "../../models/TableExamples";

function TableFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Box sx={{ maxWidth: 840, width: "100%" }}>{children}</Box>;
}

function useLocalColumns(): readonly TableColumnDef<TableExampleRecord>[] {
  const { t } = useDevelopmentGuideTranslation();
  return useMemo(
    () => [
      {
        id: "name",
        header: t("tablesExamples.shared.columns.name"),
        renderCell: ({ row }) => row.name,
        rowHeader: true,
        sort: { compare: (a, b) => a.name.localeCompare(b.name) },
      },
      {
        id: "owner",
        header: t("tablesExamples.shared.columns.owner"),
        renderCell: ({ row }) => row.owner,
        sort: { compare: (a, b) => a.owner.localeCompare(b.owner) },
      },
      {
        id: "status",
        header: t("tablesExamples.shared.columns.status"),
        renderCell: ({ row }) => t(`tablesExamples.shared.status.${row.status}`),
        sort: { compare: (a, b) => a.status.localeCompare(b.status) },
      },
    ],
    [t],
  );
}

function usePagination() {
  const { t } = useDevelopmentGuideTranslation();
  return {
    getItemAriaLabel: (type: "first" | "last" | "next" | "previous") => t(`tablesExamples.shared.pagination.${type}`),
    labelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) =>
      t("tablesExamples.shared.pagination.displayed", { count, from, to }),
    labelRowsPerPage: t("tablesExamples.shared.pagination.rowsPerPage"),
    rowsPerPageOptions: [2, 4, 6],
  };
}

function baseProps(t: ReturnType<typeof useDevelopmentGuideTranslation>["t"]) {
  return {
    emptyContent: t("tablesExamples.shared.empty"),
    getRowKey: (row: TableExampleRecord) => row.id,
    size: "small" as const,
    tableLabel: t("tablesExamples.shared.tableLabel"),
  };
}

export function ControlledServerPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const localColumns = useLocalColumns();
  const columns = useMemo(
    () =>
      localColumns.map(column => ({
        ...column,
        sort: { serverField: column.id },
      })),
    [localColumns],
  );
  const [state, setState] = useState<RgoDesktopTableState>({
    page: 0,
    rowsPerPage: 2,
    sort: null,
  });
  const pagination = usePagination();
  const rows = useMemo(() => {
    const sorted = [...tableExampleRecords];
    if (state.sort) {
      const { columnId, direction } = state.sort;
      sorted.sort((left, right) => {
        const result = String(left[columnId as keyof TableExampleRecord]).localeCompare(
          String(right[columnId as keyof TableExampleRecord]),
        );
        return direction === "asc" ? result : -result;
      });
    }
    const start = state.page * state.rowsPerPage;
    return sorted.slice(start, start + state.rowsPerPage);
  }, [state]);

  return (
    <TableFrame>
      <RgoDesktopTable
        columns={columns}
        mode="server"
        onStateChange={setState}
        pagination={pagination}
        rows={rows}
        state={state}
        totalCount={tableExampleRecords.length}
        {...baseProps(t)}
      />
    </TableFrame>
  );
}
