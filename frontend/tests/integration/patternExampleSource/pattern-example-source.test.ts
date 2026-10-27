import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { Readable } from "node:stream";
import { createServer, resolveConfig } from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createExampleSourceHandler,
  launchVsCode,
  patternExampleSource,
  resolveRepositoryBaseUrl,
} from "../../../config/pattern-example-source";

let root: string;
const sourcePath = "docs/storybook/patterns/demo/Example with spaces.tsx";

beforeEach(async () => {
  root = await mkdtemp(resolve(tmpdir(), "rgo-example-source-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

function git(...args: string[]) {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

async function fixture() {
  await mkdir(resolve(root, "docs/storybook/patterns/demo"), {
    recursive: true,
  });
  await writeFile(resolve(root, sourcePath), "export const Example = () => null");
  await writeFile(
    resolve(root, "docs/storybook/patterns/demo/Panel.tsx"),
    `const examples = [{ sourcePath:\n  '${sourcePath}' }]`,
  );
}

async function request(
  options: {
    body?: string;
    headers?: Record<string, string | undefined>;
    method?: string;
    remoteAddress?: string;
    launch?: (file: string) => Promise<void>;
  } = {},
) {
  const input = Readable.from([options.body ?? JSON.stringify({ path: sourcePath })]) as IncomingMessage;
  Object.assign(input, {
    method: options.method ?? "POST",
    headers: {
      host: "localhost:5173",
      origin: "http://localhost:5173",
      "content-type": "application/json",
      ...options.headers,
    },
    socket: { remoteAddress: options.remoteAddress ?? "127.0.0.1" },
  });
  let status = 0;
  let body = "";
  const output = {
    writeHead: (value: number) => {
      status = value;
    },
    end: (value: string) => {
      body = value;
    },
  } as unknown as ServerResponse;
  const launch = options.launch ?? vi.fn(async () => {});
  await createExampleSourceHandler(root, launch)(input, output);
  return { status, body, launch };
}

describe("Pattern repository source links", () => {
  it.each([
    "git@git.rgo.hr:team/example.git",
    "ssh://git@git.rgo.hr/team/example.git",
    "https://user:secret@git.rgo.hr/team/example.git",
  ])("resolves exact revision and application directory from %s", async remote => {
    git("init");
    git(
      "-c",
      "user.name=Example",
      "-c",
      "user.email=example@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "-c",
      "core.hooksPath=/dev/null",
      "commit",
      "--allow-empty",
      "-m",
      "Fixture",
    );
    git("remote", "add", "origin", remote);
    const app = resolve(root, "apps/My app #1");
    await mkdir(app, { recursive: true });
    const revision = git("rev-parse", "HEAD");
    expect(resolveRepositoryBaseUrl(app)).toBe(
      `https://git.rgo.hr/team/example/src/commit/${revision}/apps/My%20app%20%231/`,
    );
    expect(resolveRepositoryBaseUrl(root)).toBe(`https://git.rgo.hr/team/example/src/commit/${revision}/`);
  });

  it("allows an explicit public source URL without Git metadata", () => {
    expect(resolveRepositoryBaseUrl(root, "https://example.com/org/app/blob/revision/apps/site")).toBe(
      "https://example.com/org/app/blob/revision/apps/site/",
    );
    expect(resolveRepositoryBaseUrl(root)).toBeNull();
  });

  it.each([
    "file:///tmp/source",
    "javascript:alert(1)",
    "https://user:secret@example.com/src/",
    "https://example.com/src/?token=secret",
    "https://example.com/src/#fragment",
    "invalid",
  ])("rejects unsafe override %s", override => {
    expect(resolveRepositoryBaseUrl(root, override)).toBeNull();
  });

  it("does not invent links for an unsupported origin", () => {
    git("init");
    git(
      "-c",
      "user.name=Example",
      "-c",
      "user.email=example@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "-c",
      "core.hooksPath=/dev/null",
      "commit",
      "--allow-empty",
      "-m",
      "Fixture",
    );
    git("remote", "add", "origin", "https://example.com/team/example.git");
    expect(resolveRepositoryBaseUrl(root)).toBeNull();
  });
});

describe("Pattern source Vite integration", () => {
  beforeEach(() => {
    vi.stubEnv("RGO_EXAMPLE_SOURCE_BASE_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    {
      command: "serve" as const,
      base: "/",
      preview: false,
      endpoint: "/__rgo_open_example_source",
    },
    {
      command: "serve" as const,
      base: "/app/",
      preview: false,
      endpoint: "/app/__rgo_open_example_source",
    },
    {
      command: "build" as const,
      base: "/app/",
      preview: false,
      endpoint: null,
    },
    { command: "serve" as const, base: "/app/", preview: true, endpoint: null },
  ])(
    "defines source settings without an existing define object for $command at $base (preview=$preview)",
    async ({ command, base, preview, endpoint }) => {
      const config = await resolveConfig(
        {
          configFile: false,
          root,
          base,
          plugins: [patternExampleSource()],
          logLevel: "silent",
        },
        command,
        "development",
        "development",
        preview,
      );

      if (!config.define) throw new Error("Missing application defines");
      expect(JSON.parse(config.define.__RGO_EXAMPLE_SOURCE__)).toEqual({
        repositoryBaseUrl: null,
        editorEndpoint: endpoint,
      });
      expect(config.environments.client.define?.__RGO_EXAMPLE_SOURCE__).toBe(config.define.__RGO_EXAMPLE_SOURCE__);
    },
  );

  it("preserves application defines and reads source configuration from its resolved root", async () => {
    vi.stubEnv("RGO_EXAMPLE_SOURCE_BASE_URL", undefined);
    await writeFile(
      resolve(root, ".env.development"),
      "RGO_EXAMPLE_SOURCE_BASE_URL=https://example.com/team/app/blob/REVISION/\n",
    );
    const config = await resolveConfig(
      {
        configFile: false,
        root,
        define: { __APPLICATION_SETTING__: "true" },
        plugins: [patternExampleSource()],
        logLevel: "silent",
      },
      "serve",
    );

    if (!config.define) throw new Error("Missing application defines");
    expect(config.define.__APPLICATION_SETTING__).toBe("true");
    expect(JSON.parse(config.define.__RGO_EXAMPLE_SOURCE__)).toEqual({
      repositoryBaseUrl: "https://example.com/team/app/blob/REVISION/",
      editorEndpoint: "/__rgo_open_example_source",
    });
  });

  it("injects source settings into the browser dev environment transform", async () => {
    const server = await createServer({
      configFile: false,
      root,
      base: "/app/",
      plugins: [patternExampleSource()],
      logLevel: "silent",
      server: { middlewareMode: true, hmr: false, watch: null },
      optimizeDeps: { noDiscovery: true, include: [] },
    });
    try {
      const transformed = await server.transformRequest("/@vite/env");
      expect(transformed?.code).toContain("__RGO_EXAMPLE_SOURCE__");
      expect(transformed?.code).toContain("/app/__rgo_open_example_source");
      expect(transformed?.code).toContain("repositoryBaseUrl");
      expect(transformed?.code).not.toContain(root);
    } finally {
      await server.close();
    }
  });
});

describe("Pattern local editor boundary", () => {
  beforeEach(fixture);

  it("opens only the mapped file in the running application, preserving spaces", async () => {
    const result = await request();
    expect(result.status).toBe(200);
    expect(result.launch).toHaveBeenCalledExactlyOnceWith(resolve(root, sourcePath));
    expect(result.body).not.toContain(root);
  });

  it.each([
    { remoteAddress: "192.168.1.5" },
    {
      headers: {
        host: "evil.example:5173",
        origin: "http://evil.example:5173",
      },
    },
    { headers: { origin: "http://evil.example" } },
    { headers: { origin: "http://localhost:9000" } },
    { headers: { origin: "" } },
    { headers: { "x-forwarded-for": "192.168.1.5" } },
    { headers: { forwarded: "for=192.168.1.5" } },
  ])("rejects nonlocal, cross-origin, or forwarded access: %j", async options => {
    const result = await request(options);
    expect(result.status).toBe(403);
    expect(result.launch).not.toHaveBeenCalled();
  });

  it.each([
    {
      remoteAddress: "::1",
      headers: { host: "[::1]:5173", origin: "http://[::1]:5173" },
    },
    {
      remoteAddress: "::ffff:127.0.0.1",
      headers: { host: "127.0.0.1:5173", origin: "http://127.0.0.1:5173" },
    },
  ])("accepts IPv6 and mapped loopback: %j", async options => {
    expect((await request(options)).status).toBe(200);
  });

  it.each([
    "../secret.tsx",
    "docs/storybook/patterns/demo/../../../secret.tsx",
    "/etc/passwd",
    "docs/storybook/patterns/demo/Unknown.tsx",
    "src\\features\\patterns\\demo\\Example with spaces.tsx",
  ])("rejects unknown or traversing path %s", async path => {
    const result = await request({ body: JSON.stringify({ path }) });
    expect(result.status).toBe(400);
    expect(result.launch).not.toHaveBeenCalled();
  });

  it("rejects symlinks escaping the application", async () => {
    await rm(resolve(root, sourcePath));
    await symlink(resolve(root, ".."), resolve(root, sourcePath));
    const result = await request();
    expect(result.status).toBe(403);
    expect(result.launch).not.toHaveBeenCalled();
  });

  it("refreshes its allowlist after a feature is removed", async () => {
    await rm(resolve(root, "docs/storybook/patterns"), {
      recursive: true,
    });
    expect((await request()).status).toBe(400);
  });

  it.each([
    { options: { method: "GET" }, status: 405 },
    { options: { headers: { "content-type": "text/plain" } }, status: 415 },
    { options: { body: "{" }, status: 400 },
    { options: { body: "null" }, status: 400 },
    { options: { body: " ".repeat(4097) }, status: 413 },
  ])("rejects invalid request with $status", async ({ options, status }) => {
    const result = await request(options);
    expect(result.status).toBe(status);
    expect(result.launch).not.toHaveBeenCalled();
  });

  it("reports a failed VSCode launch without exposing filesystem paths", async () => {
    const result = await request({
      launch: async () => {
        throw new Error(`ENOENT ${root}`);
      },
    });
    expect(result.status).toBe(503);
    expect(result.body).toContain("PATH");
    expect(result.body).not.toContain(root);
  });

  it("uses shell-free VSCode arguments and rejects missing commands", async () => {
    const run = vi
      .fn<NonNullable<Parameters<typeof launchVsCode>[1]>>()
      .mockImplementation((_command, _args, _options, callback) => {
        callback(new Error("ENOENT"));
      });
    const file = resolve(root, sourcePath);
    await expect(launchVsCode(file, run)).rejects.toThrow("ENOENT");
    expect(run).toHaveBeenCalledWith("code", ["--reuse-window", file], { timeout: 10_000 }, expect.any(Function));
  });
});
