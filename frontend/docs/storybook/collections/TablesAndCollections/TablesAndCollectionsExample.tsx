import { Alert, Box, Button, Checkbox, Paper, Stack, TextField, Typography } from "@mui/material";
import { RgoDesktopTable, type RgoDesktopTableState, type TableColumnDef } from "@rgo-web/frontend";
import { useMemo, useState } from "react";

import {
  clampTablePage,
  compareProjects,
  filterProjects,
  initialTableState,
  projectRows,
  resolveProjectPage,
  type ProjectRow,
} from "./collectionFixture";

export type TablesAndCollectionsExampleProps = Readonly<{
  mode: "local" | "server";
  initialResult: "ready" | "empty" | "failed" | "loading";
}>;

const pagination = {
  getItemAriaLabel: (type: "first" | "last" | "next" | "previous") => `Go to ${type} page`,
  labelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) => `${from}–${to} of ${count}`,
  labelRowsPerPage: "Rows per page",
  rowsPerPageOptions: [2, 4, 6],
};

/** Changing the global theme preserves this collection session. */
export function TablesAndCollectionsExample(props: TablesAndCollectionsExampleProps) {
  return <CollectionSession key={`${props.mode}:${props.initialResult}`} {...props} />;
}

function CollectionSession({ mode, initialResult }: TablesAndCollectionsExampleProps) {
  const [rows, setRows] = useState<readonly ProjectRow[]>(() => (initialResult === "empty" ? [] : projectRows));
  const [search, setSearch] = useState("");
  const [state, setState] = useState(initialTableState);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [result, setResult] = useState(initialResult === "empty" ? "ready" : initialResult);
  const [archivedCount, setArchivedCount] = useState(0);
  const filteredRows = useMemo(() => filterProjects(rows, search), [rows, search]);
  const page = useMemo(() => resolveProjectPage(rows, search, state), [rows, search, state]);
  const visibleSelected = page.rows.filter(row => selectedIds.has(row.id)).length;
  const allVisibleSelected = page.rows.length > 0 && visibleSelected === page.rows.length;
  const busy = result !== "ready";

  const columns = useMemo<readonly TableColumnDef<ProjectRow>[]>(
    () => [
      {
        id: "selection",
        width: 56,
        header: (
          <Checkbox
            checked={allVisibleSelected}
            disabled={busy || page.rows.length === 0}
            indeterminate={visibleSelected > 0 && !allVisibleSelected}
            onChange={() =>
              setSelectedIds(current => {
                const next = new Set(current);
                page.rows.forEach(row => (allVisibleSelected ? next.delete(row.id) : next.add(row.id)));
                return next;
              })
            }
            size="small"
            slotProps={{ input: { "aria-label": "Select current page" } }}
          />
        ),
        renderCell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.id)}
            disabled={busy}
            onChange={() =>
              setSelectedIds(current => {
                const next = new Set(current);
                if (next.has(row.id)) next.delete(row.id);
                else next.add(row.id);
                return next;
              })
            }
            size="small"
            slotProps={{ input: { "aria-label": `Select ${row.name}` } }}
          />
        ),
      },
      ...(["name", "owner", "status"] as const).map(columnId => ({
        id: columnId,
        header: { name: "Project", owner: "Owner", status: "Status" }[columnId],
        minWidth: columnId === "name" ? 190 : 100,
        renderCell: ({ row }: { row: ProjectRow }) => row[columnId],
        rowHeader: columnId === "name",
        sort:
          mode === "server"
            ? { serverField: columnId }
            : { compare: (left: ProjectRow, right: ProjectRow) => compareProjects(left, right, columnId) },
      })),
    ],
    [allVisibleSelected, busy, mode, page.rows, selectedIds, visibleSelected],
  );

  const changeTableState = (next: RgoDesktopTableState) => {
    if (busy) return;
    const sortChanged = next.sort?.columnId !== state.sort?.columnId || next.sort?.direction !== state.sort?.direction;
    const resetPage = sortChanged || next.rowsPerPage !== state.rowsPerPage;
    setState(clampTablePage(resetPage ? { ...next, page: 0 } : next, filteredRows.length));
  };

  const archiveSelected = () => {
    // The action affects the explicit IDs, including selections on other pages.
    const remaining = rows.filter(row => !selectedIds.has(row.id));
    setArchivedCount(rows.length - remaining.length);
    setRows(remaining);
    setSelectedIds(new Set());
    setState(current => clampTablePage(current, filterProjects(remaining, search).length));
  };

  const resetCollection = () => {
    setRows(projectRows);
    setSearch("");
    setState(initialTableState);
    setSelectedIds(new Set());
    setResult("ready");
    setArchivedCount(0);
  };

  return (
    <Box component="main" sx={{ mx: "auto", maxWidth: 1000, minWidth: 0, p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Typography component="h1" variant="h4">
          Tables and collections
        </Typography>
        <Typography color="text.secondary">
          {mode === "server"
            ? "Controlled server mode: this local simulation filters and sorts all six fixture rows before returning a page."
            : "Client mode: the table receives the complete bounded filtered collection and handles sorting and pagination."}{" "}
          No backend or application storage is used.
        </Typography>
        <TextField
          disabled={busy}
          fullWidth
          label="Filter projects"
          onChange={event => {
            setSearch(event.target.value);
            setState(current => ({ ...current, page: 0 }));
            setSelectedIds(new Set());
            setArchivedCount(0);
          }}
          size="small"
          value={search}
        />
        {result === "failed" ? (
          <Alert
            action={
              <Button color="inherit" onClick={() => setResult("ready")}>
                Retry read
              </Button>
            }
            severity="error"
          >
            Refresh failed. Showing retained rows for the same request; they may be stale. Bulk actions are paused.
          </Alert>
        ) : null}
        {result === "loading" ? (
          <Button onClick={() => setResult("ready")} sx={{ alignSelf: "flex-start" }} variant="outlined">
            Finish loading
          </Button>
        ) : null}
        <Paper sx={{ minWidth: 0, overflow: "hidden" }} variant="outlined">
          <RgoDesktopTable
            columns={columns}
            emptyAction={<Button onClick={resetCollection}>Restore sample projects</Button>}
            emptyContent={rows.length ? "No projects match this filter." : "No projects in this collection."}
            getRowKey={row => row.id}
            getRowSx={({ row }) => (selectedIds.has(row.id) ? { bgcolor: "action.selected" } : undefined)}
            loadingContent="Loading projects…"
            loadingLabel="Loading projects"
            loading={result === "loading"}
            onStateChange={changeTableState}
            pagination={pagination}
            rows={result === "loading" ? [] : mode === "server" ? page.rows : filteredRows}
            size="small"
            state={state}
            sx={{
              minWidth: 0,
              "& .MuiTablePagination-toolbar": { flexWrap: "wrap", px: 1 },
              "& .MuiTablePagination-spacer": { display: "none" },
              "& .MuiTablePagination-actions": { ml: 1 },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { my: 1 },
            }}
            tableLabel="Projects collection"
            {...(mode === "server"
              ? { mode: "server", totalCount: result === "loading" ? 0 : page.totalCount }
              : { mode: "local" })}
          />
        </Paper>
        <Typography aria-live="polite" color="text.secondary" role="status" variant="body2">
          {selectedIds.size} selected across pages. Changing the filter clears selection. Select current page affects
          only its visible rows.
          {archivedCount > 0 ? ` Archived ${archivedCount} projects locally.` : ""}
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          <Button disabled={busy || selectedIds.size === 0} onClick={archiveSelected} variant="contained">
            Archive selected ({selectedIds.size})
          </Button>
          <Button disabled={selectedIds.size === 0} onClick={() => setSelectedIds(new Set())}>
            Clear selection
          </Button>
          <Button onClick={resetCollection}>Reset collection</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
