import { Box } from "@mui/material";
import { RgoDesktopTable, type TableColumnDef } from "@rgo-web/frontend";
import { useMemo } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
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

export function LocalPaginationPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const columns = useLocalColumns();
  const pagination = usePagination();
  return (
    <TableFrame>
      <RgoDesktopTable
        columns={columns}
        defaultState={{ rowsPerPage: 2 }}
        pagination={pagination}
        rows={tableExampleRecords}
        {...baseProps(t)}
      />
    </TableFrame>
  );
}
