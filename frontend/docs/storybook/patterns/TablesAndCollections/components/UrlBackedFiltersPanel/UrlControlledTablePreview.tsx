import { Box, MenuItem, Stack, TextField } from "@mui/material";
import { RgoDesktopTable, type RgoDesktopTableState, type TableColumnDef } from "@rgo-web/frontend";
import { useEffect, useMemo } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { useAppQueryParams } from "@/app/router/hooks/useAppQueryParams";
import { tableExampleRecords, type TableExampleRecord } from "../../models/TableExamples";
import {
  resolveTableUrlPage,
  tableQuerySchema,
  tableUrlStateFromValues,
  tableUrlStateToValues,
  type TableFilters,
} from "../../models/TableUrlState";

function TableFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Box sx={{ maxWidth: 840, width: "100%" }}>{children}</Box>;
}

function useColumns(server = false): readonly TableColumnDef<TableExampleRecord>[] {
  const { t } = useDevelopmentGuideTranslation();
  return useMemo(
    () => [
      {
        id: "name",
        header: t("tablesExamples.shared.columns.name"),
        renderCell: ({ row }) => row.name,
        rowHeader: true,
        sort: server ? { serverField: "name" } : { compare: (a, b) => a.name.localeCompare(b.name) },
      },
      {
        id: "owner",
        header: t("tablesExamples.shared.columns.owner"),
        renderCell: ({ row }) => row.owner,
        sort: server ? { serverField: "owner" } : { compare: (a, b) => a.owner.localeCompare(b.owner) },
      },
      {
        id: "status",
        header: t("tablesExamples.shared.columns.status"),
        renderCell: ({ row }) => t(`tablesExamples.shared.status.${row.status}`),
        sort: server ? { serverField: "status" } : { compare: (a, b) => a.status.localeCompare(b.status) },
      },
    ],
    [server, t],
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

function filterRows(filters: TableFilters): readonly TableExampleRecord[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return tableExampleRecords.filter(
    row =>
      (filters.status === "all" || row.status === filters.status) &&
      (!query || row.name.toLocaleLowerCase().includes(query) || row.owner.toLocaleLowerCase().includes(query)),
  );
}

function FilterControls({
  filters,
  onChange,
}: Readonly<{
  filters: TableFilters;
  onChange: (filters: TableFilters) => void;
}>) {
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Stack direction={{ sm: "row", xs: "column" }} spacing={2}>
      <TextField
        fullWidth
        label={t("tablesExamples.url.filters.query")}
        onChange={event => onChange({ ...filters, query: event.target.value })}
        size="small"
        value={filters.query}
      />
      <TextField
        fullWidth
        label={t("tablesExamples.url.filters.status")}
        onChange={event =>
          onChange({
            ...filters,
            status: event.target.value as TableFilters["status"],
          })
        }
        select
        size="small"
        value={filters.status}
      >
        {(["all", "active", "paused", "review"] as const).map(status => (
          <MenuItem key={status} value={status}>
            {t(`tablesExamples.shared.status.${status}`)}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}

export function UrlControlledTablePreview() {
  const { t } = useDevelopmentGuideTranslation();
  const { values, set, setValues } = useAppQueryParams(tableQuerySchema);
  const parsedState = useMemo(() => tableUrlStateFromValues(values), [values]);
  const columns = useColumns(true);
  const pagination = usePagination();
  const filteredRows = filterRows(parsedState.filters);
  const state = resolveTableUrlPage(parsedState, filteredRows.length);
  useEffect(() => {
    if (state === parsedState) return;
    set("page", state.table.page + 1, { replace: true });
  }, [parsedState, set, state]);
  const sortedRows = [...filteredRows];
  if (state.table.sort) {
    const { columnId, direction } = state.table.sort;
    sortedRows.sort((left, right) => {
      const result = String(left[columnId as keyof TableExampleRecord]).localeCompare(
        String(right[columnId as keyof TableExampleRecord]),
      );
      return direction === "asc" ? result : -result;
    });
  }
  const start = state.table.page * state.table.rowsPerPage;
  const pageRows = sortedRows.slice(start, start + state.table.rowsPerPage);

  const setTableState = (table: RgoDesktopTableState) => setValues(tableUrlStateToValues({ ...state, table }));

  return (
    <TableFrame>
      <Stack spacing={2}>
        <FilterControls
          filters={state.filters}
          onChange={filters => setValues({ ...filters, page: 1 }, { replace: true })}
        />
        <RgoDesktopTable
          columns={columns}
          emptyContent={t("tablesExamples.url.filters.empty")}
          getRowKey={row => row.id}
          mode="server"
          onStateChange={setTableState}
          pagination={pagination}
          rows={pageRows}
          size="small"
          state={state.table}
          tableLabel={t("tablesExamples.shared.tableLabel")}
          totalCount={filteredRows.length}
        />
      </Stack>
    </TableFrame>
  );
}
