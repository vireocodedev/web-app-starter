import { useCallback, useMemo } from "react";
import { useSearchParams, type NavigateOptions } from "react-router";
import type { z } from "zod";

import { parseQueryParams, updateQueryParams, type AppQueryParamsUpdate } from "../queryParams";

/** Router-owned query values. Use setValues for a single atomic multi-field update. */
export function useAppQueryParams<Schema extends z.ZodObject>(schema: Schema) {
  const [searchParams, setSearchParams] = useSearchParams();
  const values = useMemo(() => parseQueryParams(schema, searchParams), [schema, searchParams]);

  const setValues = useCallback(
    (update: AppQueryParamsUpdate<Schema>, options?: NavigateOptions): void => {
      const next = updateQueryParams(schema, searchParams, update);
      setSearchParams(next, options);
    },
    [schema, searchParams, setSearchParams],
  );

  const get = useCallback(
    <Key extends keyof z.output<Schema> & string>(key: Key): z.output<Schema>[Key] => values[key],
    [values],
  );

  const set = useCallback(
    <Key extends keyof z.output<Schema> & string>(
      key: Key,
      value: z.output<Schema>[Key],
      options?: NavigateOptions,
    ): void => {
      const update: Partial<z.output<Schema>> = {};
      update[key] = value;
      setValues(update, options);
    },
    [setValues],
  );

  return useMemo(() => ({ values, get, set, setValues }), [values, get, set, setValues]);
}
