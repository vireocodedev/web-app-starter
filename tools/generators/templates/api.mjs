/** Pure templates for an injected, read-only HTTP/Query capability. */
const file = (path, content) => ({ path, content: `${content.trim()}\n` });

function fieldSchema(field) {
  const schema = {
    string: `z.string().max(${field.maxLength})`,
    integer: "z.number().int().min(-2147483648).max(2147483647)",
    boolean: "z.boolean()",
  }[field.type ?? "string"];
  if (!schema) throw new Error(`Unsupported API field type: ${field.type}`);
  return `${schema}${field.required ? "" : ".nullable()"}`;
}

function sample(context) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    ...Object.fromEntries(
      context.fields.map(field => [
        field.name,
        !field.required
          ? null
          : field.type === "integer"
            ? 7
            : field.type === "boolean"
              ? true
              : "Sample".slice(0, field.maxLength),
      ]),
    ),
  };
}

export function renderApi(context) {
  const { name, feature, fields } = context;
  const owner = `frontend/src/features/${feature.kebab}`;
  const testOwner = `frontend/tests/features/${feature.kebab}/api`;
  const stem = name.camel;
  const schema = `${stem}Schema`;
  const apiType = `${name.pascal}Api`;
  const httpFactory = `create${name.pascal}HttpApi`;
  const queryFactory = `create${name.pascal}Query`;
  const keys = `${name.pascal}QueryKey`;
  const record = JSON.stringify(sample(context), null, 2);
  const alternate = {
    ...sample(context),
    [fields[0].name]:
      fields[0].type === "integer" ? 8 : fields[0].type === "boolean" ? false : "Other".slice(0, fields[0].maxLength),
  };
  const publicImport = `@/features/${feature.kebab}`;
  const endpoint = `/${feature.kebab}/${name.kebab}/`;
  return [
    file(
      `${owner}/models/${name.pascal}.ts`,
      `import { z } from "zod";

/** Validate the producer's scalar read projection while tolerating additive response fields. */
export const ${schema} = z.object({
  id: z.uuid(),
${fields.map(field => `  ${field.name}: ${fieldSchema(field)},`).join("\n")}
});

export type ${name.pascal} = z.infer<typeof ${schema}>;`,
    ),
    file(
      `${owner}/api/${stem}.api.ts`,
      `import type { ${name.pascal} } from "../models/${name.pascal}";

/** Domain port; transport details and response parsing belong to its adapter. */
export interface ${apiType} {
  findById(id: string, signal?: AbortSignal): Promise<${name.pascal}>;
}`,
    ),
    file(
      `${owner}/api/${stem}.api.http.ts`,
      `import type { AxiosInstance } from "axios";
import type { ${apiType} } from "./${stem}.api";
import { ${schema} } from "../models/${name.pascal}";

/** Inject the configured application Axios instance; its base URL supplies /api. */
export function ${httpFactory}(http: AxiosInstance): ${apiType} {
  return Object.freeze({
    async findById(id: string, signal?: AbortSignal) {
      const response = await http.get("${endpoint}" + encodeURIComponent(id), { signal });
      return ${schema}.parse(response.data);
    },
  });
}`,
    ),
    file(
      `${owner}/api/${stem}.querykeys.ts`,
      `/** Scope is a nonsecret actor/tenant identity chosen by the owning runtime. */
export const ${keys} = {
  all: (scope: string) => ["${feature.kebab}", "${name.kebab}", scope] as const,
  detail: (scope: string, id: string) => [...${keys}.all(scope), "detail", id] as const,
} as const;`,
    ),
    file(
      `${owner}/api/${stem}.query.ts`,
      `import { queryOptions } from "@tanstack/react-query";
import type { ${apiType} } from "./${stem}.api";
import { ${keys} } from "./${stem}.querykeys";

/** Construct once per result scope; auth revocation and cache cleanup remain caller-owned. */
export function ${queryFactory}(api: ${apiType}, scope: string) {
  if (!scope.trim()) throw new TypeError("A nonempty query result scope is required.");
  return Object.freeze({
    findById: (id: string) => queryOptions({
      queryKey: ${keys}.detail(scope, id),
      queryFn: ({ signal }) => api.findById(id, signal),
    }),
  });
}

export type ${name.pascal}Query = ReturnType<typeof ${queryFactory}>;`,
    ),
    file(
      `${owner}/index.ts`,
      `export type { ${name.pascal} } from "./models/${name.pascal}";
export type { ${apiType} } from "./api/${stem}.api";
export { ${httpFactory} } from "./api/${stem}.api.http";
export { ${queryFactory} } from "./api/${stem}.query";
export type { ${name.pascal}Query } from "./api/${stem}.query";
export { ${keys} } from "./api/${stem}.querykeys";`,
    ),
    file(
      `${testOwner}/${stem}.api.http.test.ts`,
      `import axios, { type AxiosAdapter } from "axios";
import { describe, expect, it, vi } from "vitest";
import { ${httpFactory} } from "${publicImport}";

const record = ${record};

function createHttp(data: unknown) {
  const adapter: AxiosAdapter = async config => ({ data, config, status: 200, statusText: "OK", headers: {} });
  const request = vi.fn(adapter);
  return { http: axios.create({ adapter: request }), request };
}

describe("${name.pascal} HTTP boundary", () => {
  it("encodes the path segment and forwards cancellation to the injected client", async () => {
    const { http, request } = createHttp(record);
    const controller = new AbortController();
    await expect(${httpFactory}(http).findById("needs/encoding", controller.signal)).resolves.toEqual(record);
    expect(request.mock.calls[0]?.[0].url).toBe("${endpoint}needs%2Fencoding");
    expect(request.mock.calls[0]?.[0].signal).toBe(controller.signal);
  });
  it("tolerates additive response fields without exposing unvalidated values", async () => {
    const { http } = createHttp({ ...record, futureField: "available in a newer producer" });
    await expect(${httpFactory}(http).findById(record.id)).resolves.toEqual(record);
  });
  it("rejects malformed identifiers and scalar fields at the response boundary", async () => {
    const invalidId = createHttp({ ...record, id: "invalid-uuid" });
    await expect(${httpFactory}(invalidId.http).findById(record.id)).rejects.toThrow();
    const invalidField = createHttp({ ...record, ${fields[0].name}: {} });
    await expect(${httpFactory}(invalidField.http).findById(record.id)).rejects.toThrow();
  });
  it("does not dispatch an already-cancelled request", async () => {
    const { http, request } = createHttp(record);
    const controller = new AbortController(); controller.abort();
    await expect(${httpFactory}(http).findById(record.id, controller.signal)).rejects.toMatchObject({ code: "ERR_CANCELED" });
    expect(request).not.toHaveBeenCalled();
  });
  it("preserves transport failure for the caller's recovery policy", async () => {
    const failure = new Error("Transport unavailable");
    const http = axios.create({ adapter: async () => { throw failure; } });
    await expect(${httpFactory}(http).findById(record.id)).rejects.toBe(failure);
  });
});`,
    ),
    file(
      `${testOwner}/${stem}.query.test.ts`,
      `import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { ${queryFactory}, ${keys}, type ${apiType} } from "${publicImport}";

const record = ${record};

describe("${name.pascal} query ownership", () => {
  it("keeps cached results from different scopes independent", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    const first: ${apiType} = { findById: vi.fn(async () => record) };
    const secondRecord = ${JSON.stringify(alternate, null, 2)};
    const second: ${apiType} = { findById: vi.fn(async () => secondRecord) };
    try {
      const firstResult = await client.fetchQuery(${queryFactory}(first, "viewer-a").findById(record.id));
      const secondResult = await client.fetchQuery(${queryFactory}(second, "viewer-b").findById(record.id));
      expect(firstResult).toEqual(record);
      expect(secondResult).toEqual(secondRecord);
      expect(first.findById).toHaveBeenCalledTimes(1);
      expect(second.findById).toHaveBeenCalledTimes(1);
      expect(client.getQueryData(${keys}.detail("viewer-a", record.id))).toEqual(record);
    } finally { client.clear(); }
  });
  it("forwards Query cancellation to the outstanding API operation", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const received: AbortSignal[] = [];
    const api: ${apiType} = { findById: (_id, signal) => new Promise((_resolve, reject) => {
      if (!signal) { reject(new Error("Missing cancellation signal")); return; }
      received.push(signal);
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    }) };
    try {
      const result = client.fetchQuery(${queryFactory}(api, "viewer-a").findById(record.id)).catch(error => error);
      await client.cancelQueries({ queryKey: ${keys}.detail("viewer-a", record.id) });
      expect(received).toHaveLength(1);
      expect(received[0]?.aborted).toBe(true);
      await result;
    } finally { client.clear(); }
  });
  it("requires an explicit nonempty result scope", () => {
    const api: ${apiType} = { findById: async () => record };
    expect(() => ${queryFactory}(api, " ")).toThrow("scope");
  });
});`,
    ),
  ];
}
