export type ServerDataOutcome = "empty" | "error" | "success";

export type ServerDataFilters = Readonly<{
  outcome?: ServerDataOutcome;
  page?: number;
  pageSize?: number;
  search?: string;
}>;

export type NormalizedServerDataFilters = Readonly<{
  outcome: ServerDataOutcome;
  page: number;
  pageSize: number;
  search: string;
}>;

export function normalizeServerDataFilters(filters: ServerDataFilters = {}): NormalizedServerDataFilters {
  return {
    outcome: filters.outcome ?? "success",
    page: Math.max(1, Math.floor(filters.page ?? 1)),
    pageSize: Math.max(1, Math.floor(filters.pageSize ?? 3)),
    search: filters.search?.trim() ?? "",
  };
}
