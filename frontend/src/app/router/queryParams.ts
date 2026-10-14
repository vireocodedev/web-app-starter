import { z } from "zod";

export type AppQueryParamsUpdate<Schema extends z.ZodObject> =
  Partial<z.output<Schema>> | ((values: z.output<Schema>) => Partial<z.output<Schema>>);

type QueryDefaults = Record<string, unknown>;

const schemaDefaults = new WeakMap<z.ZodObject, QueryDefaults>();

function assertScalar(value: unknown): void {
  if (value !== undefined && typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    throw new TypeError("Query parameter outputs must be scalar values.");
  }
}

function assertWireValue(value: unknown): asserts value is string | undefined {
  if (value !== undefined && typeof value !== "string") {
    throw new TypeError("Query parameters must encode to strings. Use a Zod codec.");
  }
}

function getDefaults(schema: z.ZodObject): QueryDefaults {
  const cached = schemaDefaults.get(schema);
  if (cached) return cached;

  const defaults = z.parse(schema, {});
  // Encoding also rejects one-way transforms and invalid output defaults.
  const encoded = z.encode(schema, defaults);
  for (const key of Object.keys(schema.shape)) {
    assertScalar(defaults[key]);
    assertWireValue(encoded[key]);
  }
  schemaDefaults.set(schema, defaults);
  return defaults;
}

/** Reads independent scalar fields, falling back per field without rewriting the URL. */
export function parseQueryParams<Schema extends z.ZodObject>(
  schema: Schema,
  search: URLSearchParams | string,
): z.output<Schema> {
  const params = new URLSearchParams(search);
  const defaults = getDefaults(schema);

  const values = Object.fromEntries(
    Object.entries(schema.shape).map(([key, field]) => {
      const raw = params.get(key);
      if (raw === null) return [key, defaults[key]];
      const parsed = z.safeParse(field, raw);
      const value = parsed.success ? parsed.data : defaults[key];
      assertScalar(value);
      return [key, value];
    }),
  ) as z.output<Schema>;

  // Object refinements may couple otherwise valid fields. Keep their defaults
  // together if that combination is invalid; malformed individual fields above
  // still fall back independently.
  const encoded = z.safeEncode(schema, values);
  if (!encoded.success) return { ...defaults } as z.output<Schema>;
  for (const key of Object.keys(schema.shape)) {
    assertWireValue(encoded.data[key]);
  }
  return values;
}

/** Validates an atomic patch and canonicalizes schema fields, preserving unrelated parameters. */
export function updateQueryParams<Schema extends z.ZodObject>(
  schema: Schema,
  search: URLSearchParams | string,
  update: AppQueryParamsUpdate<Schema>,
): URLSearchParams {
  const current = parseQueryParams(schema, search);
  const patch = typeof update === "function" ? update(current) : update;
  if (!patch || typeof patch !== "object" || ![Object.prototype, null].includes(Object.getPrototypeOf(patch))) {
    throw new TypeError("Query parameter updates must be synchronous objects.");
  }
  const keys = Object.keys(patch);
  for (const key of keys) {
    if (!Object.hasOwn(schema.shape, key)) {
      throw new TypeError(`Unknown query parameter: ${key}`);
    }
  }

  const nextValues = { ...current, ...patch };
  const encoded = z.encode(schema, nextValues);
  const defaults = getDefaults(schema);
  const next = new URLSearchParams(search);
  for (const key of Object.keys(schema.shape)) {
    const value: unknown = nextValues[key];
    const wireValue: unknown = encoded[key];
    assertScalar(value);
    assertWireValue(wireValue);
    next.delete(key);
    if (wireValue !== undefined && !Object.is(value, defaults[key])) {
      next.set(key, wireValue);
    }
  }
  return next;
}
