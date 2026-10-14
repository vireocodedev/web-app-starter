import type { RgoDesktopTableState } from "@rgo-web/frontend";
import { z } from "zod";

import { parseQueryParams, updateQueryParams } from "@/app/router/queryParams";
import type { TableExampleStatus } from "./TableExamples";

export type TableFilters = Readonly<{
  query: string;
  status: TableExampleStatus | "all";
}>;

export type TableUrlState = Readonly<{
  filters: TableFilters;
  table: RgoDesktopTableState;
}>;

export const defaultTableUrlState: TableUrlState = {
  filters: { query: "", status: "all" },
  table: { page: 0, rowsPerPage: 2, sort: null },
};

const allowedPageSizes = new Set([2, 4, 6]);
const sortColumnSchema = z.enum(["name", "owner", "status"]);
const positiveInteger = z.codec(z.string().regex(/^\d+$/), z.number().int().positive().max(Number.MAX_SAFE_INTEGER), {
  decode: Number,
  encode: String,
});
const pageSize = z.codec(
  z.string().regex(/^\d+$/),
  z
    .number()
    .int()
    .refine(value => allowedPageSizes.has(value)),
  { decode: Number, encode: String },
);

/** URL values stay one-based; conversion to table state belongs to this feature. */
export const tableQuerySchema = z.object({
  query: z.string().default(""),
  status: z.enum(["all", "active", "paused", "review"]).default("all"),
  page: positiveInteger.default(1),
  size: pageSize.default(2),
  sort: z.enum(["", "name", "owner", "status"]).default(""),
  direction: z.enum(["", "asc", "desc"]).default(""),
});

export type TableQueryValues = z.output<typeof tableQuerySchema>;

export function tableUrlStateFromValues(values: TableQueryValues): TableUrlState {
  return {
    filters: { query: values.query, status: values.status },
    table: {
      page: values.page - 1,
      rowsPerPage: values.size,
      sort: values.sort && values.direction ? { columnId: values.sort, direction: values.direction } : null,
    },
  };
}

export function tableUrlStateToValues(state: TableUrlState): TableQueryValues {
  const sortColumn = sortColumnSchema.safeParse(state.table.sort?.columnId);
  return {
    query: state.filters.query.trim() ? state.filters.query : "",
    status: state.filters.status,
    page: state.table.page + 1,
    size: allowedPageSizes.has(state.table.rowsPerPage)
      ? state.table.rowsPerPage
      : defaultTableUrlState.table.rowsPerPage,
    sort: state.table.sort && sortColumn.success ? sortColumn.data : "",
    direction: state.table.sort && sortColumn.success ? state.table.sort.direction : "",
  };
}

export function parseTableUrlState(searchParams: URLSearchParams): TableUrlState {
  return tableUrlStateFromValues(parseQueryParams(tableQuerySchema, searchParams));
}

export function serializeTableUrlState(state: TableUrlState, searchParams = new URLSearchParams()): URLSearchParams {
  return updateQueryParams(tableQuerySchema, searchParams, tableUrlStateToValues(state));
}

export function withTableFilters(state: TableUrlState, filters: TableFilters): TableUrlState {
  return { ...state, filters, table: { ...state.table, page: 0 } };
}

/** Resolves a URL-owned server page after the collection total becomes known. */
export function resolveTableUrlPage(state: TableUrlState, totalCount: number): TableUrlState {
  const pageCount = Math.ceil(Math.max(0, totalCount) / Math.max(1, state.table.rowsPerPage));
  const page = Math.min(state.table.page, Math.max(0, pageCount - 1));

  return page === state.table.page ? state : { ...state, table: { ...state.table, page } };
}
