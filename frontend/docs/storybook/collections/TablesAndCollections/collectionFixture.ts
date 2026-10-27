import type { RgoDesktopTableState } from "@rgo-web/frontend";

/** Complete bounded teaching data; no application storage or network is used. */
export type ProjectRow = Readonly<{
  id: string;
  name: string;
  owner: string;
  status: "Active" | "Paused" | "Review";
}>;

export const projectRows: readonly ProjectRow[] = [
  { id: "atlas", name: "Atlas migration", owner: "Mia", status: "Active" },
  { id: "beacon", name: "Beacon rollout", owner: "Noah", status: "Review" },
  { id: "canal", name: "Canal inspection", owner: "Luka", status: "Paused" },
  { id: "delta", name: "Delta renewal", owner: "Eva", status: "Active" },
  { id: "ember", name: "Ember retrofit", owner: "Iva", status: "Review" },
  { id: "fjord", name: "Fjord survey", owner: "Leo", status: "Paused" },
];

export const initialTableState: RgoDesktopTableState = { page: 0, rowsPerPage: 2, sort: null };

export function filterProjects(rows: readonly ProjectRow[], search: string) {
  const query = search.trim().toLowerCase();
  return rows.filter(row => `${row.name} ${row.owner} ${row.status}`.toLowerCase().includes(query));
}

export function compareProjects(left: ProjectRow, right: ProjectRow, columnId: string) {
  switch (columnId) {
    case "owner":
      return left.owner.localeCompare(right.owner, "en") || left.id.localeCompare(right.id, "en");
    case "status":
      return left.status.localeCompare(right.status, "en") || left.id.localeCompare(right.id, "en");
    default:
      return left.name.localeCompare(right.name, "en") || left.id.localeCompare(right.id, "en");
  }
}

export function clampTablePage(state: RgoDesktopTableState, totalCount: number): RgoDesktopTableState {
  const page = Math.min(state.page, Math.max(0, Math.ceil(totalCount / state.rowsPerPage) - 1));
  return page === state.page ? state : { ...state, page };
}

/** Simulates a server: filter and sort the entire source BEFORE taking a page. */
export function resolveProjectPage(rows: readonly ProjectRow[], search: string, state: RgoDesktopTableState) {
  const filtered = filterProjects(rows, search);
  const sort = state.sort;
  const ordered = sort
    ? [...filtered].sort((left, right) => {
        const compared = compareProjects(left, right, sort.columnId);
        return sort.direction === "asc" ? compared : -compared;
      })
    : filtered;
  const resolvedState = clampTablePage(state, ordered.length);
  const start = resolvedState.page * resolvedState.rowsPerPage;
  return { rows: ordered.slice(start, start + resolvedState.rowsPerPage), totalCount: ordered.length };
}
