import { AxiosError, AxiosHeaders, CanceledError, type AxiosInstance, type AxiosResponse } from "axios";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { createAppAuthRuntime } from "@/app/auth/createAppAuthRuntime";
import { createAppAxios } from "@/app/data/http/createAppAxios";
import { createAppQueryClient } from "@/app/data/query/createAppQueryClient";

export type BackendScenario = "overview" | "validation" | "missing" | "malformed" | "forbidden";
export const requestSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  version: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
});
export const requestPageSchema = z.object({
  items: z.array(requestSchema),
  total: z.number().int().nonnegative(),
});
export const updateRequestSchema = z.object({
  title: z.string().trim().min(1).max(80),
  expectedVersion: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
});
export type RequestRecord = z.infer<typeof requestSchema>;
export type RequestUpdate = z.infer<typeof updateRequestSchema>;
export type RequestPage = z.infer<typeof requestPageSchema>;
export interface TutorialRequestApi {
  findPage(page: number, signal?: AbortSignal): Promise<RequestPage>;
  findById(id: string, signal?: AbortSignal): Promise<RequestRecord>;
  update(id: string, input: RequestUpdate): Promise<RequestRecord>;
}
export class ResponseContractError extends Error {
  readonly write: boolean;
  constructor(write: boolean) {
    super("The response does not match the endpoint contract.");
    this.write = write;
    this.name = "ResponseContractError";
  }
}

/** Private consumer recipe: the installed application has no requests endpoint. */
export function createTutorialRequestApi(http: AxiosInstance): TutorialRequestApi {
  return {
    async findPage(page, signal) {
      const response = await http.get("/tutorial/requests", { params: { page, size: 2 }, signal });
      const parsed = requestPageSchema.safeParse(response.data);
      if (!parsed.success) throw new ResponseContractError(false);
      return parsed.data;
    },
    async findById(id, signal) {
      const response = await http.get(`/tutorial/requests/${encodeURIComponent(id)}`, { signal });
      const parsed = requestSchema.safeParse(response.data);
      if (!parsed.success || parsed.data.id !== id) throw new ResponseContractError(false);
      return parsed.data;
    },
    async update(id, input) {
      const { title, expectedVersion } = updateRequestSchema.parse(input);
      const response = await http.patch(`/tutorial/requests/${encodeURIComponent(id)}`, { title, expectedVersion });
      const parsed = requestSchema.safeParse(response.data);
      if (!parsed.success || parsed.data.id !== id || parsed.data.version <= expectedVersion)
        throw new ResponseContractError(true);
      return parsed.data;
    },
  };
}

export const requestKeys = {
  lists: (viewer: string) => ["tutorial-requests", viewer, "lists"] as const,
  page: (viewer: string, page: number) => ["tutorial-requests", viewer, "lists", { page, size: 2 }] as const,
  detail: (viewer: string, id: string) => ["tutorial-requests", viewer, "detail", id] as const,
};

export function createBackendFeatureFixture(scenario: BackendScenario) {
  let record: RequestRecord = { id: "request-17", title: "Office chairs", version: 7 };
  let repaired = false;
  let csrf = 0;
  let writes = 0;
  let events: readonly string[] = [];
  const listeners = new Set<() => void>();
  const lifetime = new AbortController();
  const timers = new Map<ReturnType<typeof setTimeout>, () => void>();
  const log = (message: string) => {
    if (lifetime.signal.aborted) return;
    events = [...events, message];
    listeners.forEach(listener => listener());
  };
  const wait = (signal?: {
    aborted: boolean;
    addEventListener?: AbortSignal["addEventListener"];
    removeEventListener?: AbortSignal["removeEventListener"];
  }) =>
    new Promise<void>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        timers.delete(timer);
        signal?.removeEventListener?.("abort", abort);
        reject(new CanceledError("Private preview read canceled."));
      };
      const timer = setTimeout(() => {
        timers.delete(timer);
        signal?.removeEventListener?.("abort", abort);
        resolve();
      }, 180);
      timers.set(timer, abort);
      signal?.addEventListener?.("abort", abort, { once: true });
      if (signal?.aborted || lifetime.signal.aborted) abort();
    });
  const http = createAppAxios({
    VITE_API_BASE_URL: "https://storybook.example.invalid/api",
    VITE_API_MODE: "http",
    VITE_API_WITH_CREDENTIALS: true,
    VITE_APP_ENV: "test",
    VITE_REQUEST_TIMEOUT_MS: 1000,
  });
  http.defaults.adapter = async config => {
    const method = (config.method ?? "GET").toUpperCase();
    log(`${method} ${config.url}`);
    try {
      await wait(config.signal);
    } catch (error) {
      log("Obsolete read aborted before a response.");
      throw error;
    }
    const errorBody = (code: string, fieldErrors: { field: string; code: string }[] = []) => ({
      code,
      message: "Untrusted server prose must never be rendered.",
      fieldErrors,
    });
    let status = 200;
    let data: unknown;
    if (method === "GET" && config.url === "/auth/csrf") {
      csrf += 1;
      data = { headerName: "X-CSRF-TOKEN", token: `private-${csrf}` };
      log(`Fresh CSRF response ${csrf}.`);
    } else if (method === "GET" && config.url === "/tutorial/requests") {
      data = { items: [{ ...record }], total: 1 };
    } else if (method === "GET" && config.url === "/tutorial/requests/request-17") {
      if (scenario === "missing" && !repaired) {
        status = 404;
        data = errorBody("REQUEST_REJECTED");
      } else data = { ...record };
    } else if (method === "PATCH" && config.url === "/tutorial/requests/request-17") {
      writes += 1;
      const body = updateRequestSchema.parse(typeof config.data === "string" ? JSON.parse(config.data) : config.data);
      log(`Editable projection: title, expectedVersion (${body.expectedVersion}).`);
      if (AxiosHeaders.from(config.headers).get("X-CSRF-TOKEN") !== `private-${csrf}` || csrf === 0) {
        status = 403;
        data = errorBody("CSRF_INVALID");
      } else if (scenario === "forbidden" && !repaired) {
        status = 403;
        data = errorBody("FORBIDDEN");
      } else if (scenario === "validation" && !repaired) {
        status = 400;
        data = errorBody("VALIDATION_FAILED", [
          { field: "title", code: "TOO_LONG" },
          { field: "internalApproval", code: "REQUIRED" },
        ]);
      } else if (body.expectedVersion !== record.version) {
        status = 409;
        data = errorBody("REQUEST_REJECTED");
      } else {
        record = { ...record, title: body.title, version: record.version + 1 };
        data = scenario === "malformed" && !repaired ? { invalid: true } : { ...record };
        log("Server committed the change.");
      }
      log(`Write response status: ${status}.`);
    } else throw new Error(`Unknown private endpoint: ${method} ${config.url}`);
    const response: AxiosResponse = { config, data, headers: new AxiosHeaders(), status, statusText: String(status) };
    if (status >= 400)
      throw new AxiosError(`Synthetic HTTP ${status}`, AxiosError.ERR_BAD_RESPONSE, config, undefined, response);
    return response;
  };
  const queryClient = createAppQueryClient({ retry: () => false });
  // Installs the actual session-owned interceptors exactly once on this private client.
  createAppAuthRuntime({ http, queryClient });
  const api = createTutorialRequestApi(http);
  const viewer = "viewer-alex";
  const query = {
    page: (page: number) =>
      queryOptions({ queryKey: requestKeys.page(viewer, page), queryFn: ({ signal }) => api.findPage(page, signal) }),
    detail: () =>
      queryOptions({
        queryKey: requestKeys.detail(viewer, "request-17"),
        queryFn: ({ signal }) => api.findById("request-17", signal),
      }),
  };
  return {
    api,
    query,
    queryClient,
    mutation: mutationOptions({ mutationFn: (input: RequestUpdate) => api.update("request-17", input), retry: false }),
    refresh: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: requestKeys.lists(viewer) }, { throwOnError: true }),
        queryClient.invalidateQueries({ queryKey: requestKeys.detail(viewer, "request-17") }, { throwOnError: true }),
      ]);
    },
    getEvents: () => events,
    getWrites: () => writes,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    repair: () => {
      repaired = true;
      log("Simulated endpoint repaired; retry only the appropriate operation.");
    },
    dispose: () => {
      lifetime.abort();
      [...timers.values()].forEach(abort => abort());
      void queryClient.cancelQueries();
      queryClient.clear();
      http.interceptors.request.clear();
      http.interceptors.response.clear();
      listeners.clear();
    },
  };
}
