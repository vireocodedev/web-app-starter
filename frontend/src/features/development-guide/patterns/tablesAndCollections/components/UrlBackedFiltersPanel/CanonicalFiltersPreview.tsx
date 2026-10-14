import { Box, MenuItem, Stack, TextField } from "@mui/material";
import { RgoDesktopTable, type TableColumnDef } from "@rgo-web/frontend";
import { useMemo } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { useAppQueryParams } from "@/app/router/hooks/useAppQueryParams";
import { tableExampleRecords, type TableExampleRecord } from "../../models/TableExamples";
import { tableQuerySchema, tableUrlStateFromValues, type TableFilters } from "../../models/TableUrlState";

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

export function CanonicalFiltersPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const { values, setValues } = useAppQueryParams(tableQuerySchema);
  const state = tableUrlStateFromValues(values);
  const rows = filterRows(state.filters);
  const columns = useColumns();

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
          rows={rows}
          size="small"
          tableLabel={t("tablesExamples.shared.tableLabel")}
        />
      </Stack>
    </TableFrame>
  );
}
