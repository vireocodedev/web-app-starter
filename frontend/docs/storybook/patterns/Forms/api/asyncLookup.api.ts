import { lookupPeople, type LookupFilters, type LookupPerson } from "../models/AsyncLookup";

/** Each preview owns its fixture, including the deterministic first-failure switch. */
export function createAsyncLookupApi({ delayMs = 650, failFirst = false } = {}) {
  let shouldFail = failFirst;
  return {
    findPeople(filters: LookupFilters, signal: AbortSignal): Promise<readonly LookupPerson[]> {
      return new Promise((resolve, reject) => {
        const abort = () => {
          globalThis.clearTimeout(timer);
          signal.removeEventListener("abort", abort);
          reject(new DOMException("Lookup cancelled", "AbortError"));
        };
        const timer = globalThis.setTimeout(() => {
          signal.removeEventListener("abort", abort);
          if (shouldFail) {
            shouldFail = false;
            reject(new Error("Lookup unavailable"));
            return;
          }
          const search = filters.search.trim().toLowerCase();
          resolve(
            lookupPeople.filter(
              person =>
                (!filters.department || person.department === filters.department) &&
                person.label.toLowerCase().includes(search),
            ),
          );
        }, delayMs);
        if (signal.aborted) abort();
        else signal.addEventListener("abort", abort, { once: true });
      });
    },
  };
}
