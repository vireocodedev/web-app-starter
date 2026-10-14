import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { createAppAxios } from "@/app/data/http/createAppAxios";

const config = {
  VITE_API_BASE_URL: "/api",
  VITE_API_MODE: "http",
  VITE_API_WITH_CREDENTIALS: true,
  VITE_APP_ENV: "test",
  VITE_REQUEST_TIMEOUT_MS: 5_000,
} as const;

describe("createAppAxios", () => {
  it("configures application policy without forcing a content type", () => {
    const client = createAppAxios(config);

    expect(client.defaults).toMatchObject({
      baseURL: "/api",
      timeout: 5_000,
      withCredentials: true,
    });
    expect(client.defaults.headers.Accept).toBe("application/json");
    expect(client.defaults.headers["Content-Type"]).toBeUndefined();
  });

  it("lets Axios add JSON content type only when serializing a body", async () => {
    const requests: InternalAxiosRequestConfig[] = [];
    const adapter: AxiosAdapter = async request => {
      requests.push(request);
      return {
        config: request,
        data: {},
        headers: {},
        status: 200,
        statusText: "OK",
      };
    };
    const client = createAppAxios(config);
    client.defaults.adapter = adapter;

    await client.get("/projects");
    await client.post("/projects", { name: "New project" });

    expect(requests[0]?.headers.getContentType()).toBeUndefined();
    expect(requests[1]?.headers.getContentType()).toBe("application/json");
  });
});
