import {
  normalizeServerDataFilters,
  type NormalizedServerDataFilters,
  type ServerDataFilters,
} from "../models/ServerDataFilters";
import type { ServerDataPage, ServerDataRecord, ServerDataRecordStatus } from "../models/ServerDataRecord";

type RequestOptions = Readonly<{ signal?: AbortSignal }>;

type ServerDataExampleApiOptions = Readonly<{
  delayMs?: number;
  records?: readonly ServerDataRecord[];
}>;

export type ServerDataExampleApi = Readonly<{
  findAll: (filters?: ServerDataFilters, options?: RequestOptions) => Promise<ServerDataPage>;
  updateStatus: (
    recordId: string,
    status: ServerDataRecordStatus,
    options?: RequestOptions,
  ) => Promise<ServerDataRecord>;
}>;

const defaultRecords = [
  { id: "atlas", name: "Atlas rollout", status: "active" },
  { id: "billing", name: "Billing refresh", status: "paused" },
  { id: "catalog", name: "Catalog migration", status: "active" },
  { id: "delivery", name: "Delivery tracking", status: "paused" },
  { id: "exports", name: "Export service", status: "active" },
  { id: "forecast", name: "Forecast workspace", status: "active" },
] as const satisfies readonly ServerDataRecord[];

function abortError() {
  return new DOMException("The request was cancelled.", "AbortError");
}

function delayedResult<T>(delayMs: number, signal: AbortSignal | undefined, resolveValue: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const cleanup = () => signal?.removeEventListener("abort", handleAbort);
    const timer = globalThis.setTimeout(() => {
      cleanup();
      try {
        resolve(resolveValue());
      } catch (error) {
        reject(error);
      }
    }, delayMs);
    const handleAbort = () => {
      globalThis.clearTimeout(timer);
      cleanup();
      reject(abortError());
    };

    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

function pageRecords(records: readonly ServerDataRecord[], filters: NormalizedServerDataFilters): ServerDataPage {
  const matching =
    filters.outcome === "empty"
      ? []
      : records.filter(record => record.name.toLocaleLowerCase().includes(filters.search.toLowerCase()));
  const offset = (filters.page - 1) * filters.pageSize;

  return {
    items: matching.slice(offset, offset + filters.pageSize),
    page: filters.page,
    pageSize: filters.pageSize,
    total: matching.length,
  };
}

/** Creates an isolated deterministic backend for one interactive pattern panel. */
export function createServerDataExampleApi(options: ServerDataExampleApiOptions = {}): ServerDataExampleApi {
  const delayMs = options.delayMs ?? 550;
  let failedControlledRequest = false;
  let records = [...(options.records ?? defaultRecords)];

  return Object.freeze({
    findAll: (filters = {}, request = {}) => {
      const normalized = normalizeServerDataFilters(filters);

      return delayedResult(delayMs, request.signal, () => {
        if (normalized.outcome === "error" && !failedControlledRequest) {
          failedControlledRequest = true;
          throw new Error("serverDataExamples.shared.requestFailed");
        }

        return pageRecords(
          records,
          normalized.outcome === "error" ? { ...normalized, outcome: "success" } : normalized,
        );
      });
    },
    updateStatus: (recordId, status, request = {}) =>
      delayedResult(delayMs, request.signal, () => {
        const current = records.find(record => record.id === recordId);
        if (!current) throw new Error("serverDataExamples.shared.recordMissing");

        const updated = { ...current, status };
        records = records.map(record => (record.id === recordId ? updated : record));
        return updated;
      }),
  });
}
