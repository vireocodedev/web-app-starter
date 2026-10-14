import type { ServerDataRecord } from "../models/ServerDataRecord";

export type OptimisticRecord = ServerDataRecord & Readonly<{ revision: number }>;
export type OptimisticSave = Readonly<{
  status: ServerDataRecord["status"];
  rejectSave: boolean;
}>;

export type OptimisticExampleApi = Readonly<{
  list: (signal: AbortSignal) => Promise<readonly OptimisticRecord[]>;
  detail: (signal: AbortSignal) => Promise<OptimisticRecord>;
  save: (input: OptimisticSave) => Promise<OptimisticRecord>;
}>;

function delayed<T>(read: () => T, delayMs: number, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Cancelled", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      try {
        resolve(read());
      } catch (error) {
        reject(error);
      }
    }, delayMs);
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
  });
}

/** Each mounted preview gets an independent, repeatable simulated server. */
export function createOptimisticExampleApi(delayMs = 700): OptimisticExampleApi {
  let record: OptimisticRecord = {
    id: "atlas",
    name: "Atlas",
    status: "active",
    revision: 1,
  };
  return {
    list: signal => delayed(() => [{ ...record }], delayMs / 3, signal),
    detail: signal => delayed(() => ({ ...record }), delayMs / 3, signal),
    save: ({ status, rejectSave }) =>
      delayed(() => {
        if (rejectSave) throw new Error("Rejected by the example server");
        record = { ...record, status, revision: record.revision + 1 };
        return { ...record };
      }, delayMs),
  };
}
