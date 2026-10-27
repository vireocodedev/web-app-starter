import { execFile, execFileSync } from "node:child_process";
import { readdir, readFile, realpath, stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { loadEnv, type Plugin } from "vite";

const endpointName = "__rgo_open_example_source";

function inside(root: string, file: string) {
  const path = relative(root, file);
  return path !== "" && !isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`);
}

function encodePath(path: string) {
  return path.split(/[\\/]/).map(encodeURIComponent).join("/");
}

/** Overrides include the repository revision and the application's directory. */
export function resolveRepositoryBaseUrl(root: string, override?: string): string | null {
  if (override?.trim()) {
    try {
      const url = new URL(override.trim());
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash)
        return null;
      return `${url.href.replace(/\/+$/, "")}/`;
    } catch {
      return null;
    }
  }

  try {
    const git = (...args: string[]) =>
      execFileSync("git", ["-C", root, ...args], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 5_000,
      }).trim();
    const gitRoot = git("rev-parse", "--show-toplevel");
    const revision = git("rev-parse", "--verify", "HEAD");
    if (!/^[a-f\d]{40,64}$/.test(revision) || (resolve(root) !== resolve(gitRoot) && !inside(gitRoot, root)))
      return null;
    const remote = git("remote", "get-url", "origin");
    const scp = /^(?:[^@/:]+@)?git\.rgo\.hr:([^?#]+)$/.exec(remote);
    const url = new URL(scp ? `ssh://git.rgo.hr/${scp[1]}` : remote);
    if (!["ssh:", "https:", "http:"].includes(url.protocol) || url.hostname !== "git.rgo.hr" || url.search || url.hash)
      return null;
    const repository = url.pathname.replace(/^\/+|\/+$/g, "").replace(/\.git$/, "");
    const segments = repository.split("/");
    if (segments.length !== 2 || segments.some(segment => !segment || segment === "." || segment === "..")) return null;
    const appPath = relative(gitRoot, root);
    return `https://git.rgo.hr/${segments.map(segment => encodeURIComponent(decodeURIComponent(segment))).join("/")}/src/commit/${revision}/${appPath ? `${encodePath(appPath)}/` : ""}`;
  } catch {
    return null;
  }
}

async function examplePaths(root: string): Promise<Set<string>> {
  const paths = new Set<string>();
  async function visit(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = resolve(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      if (!entry.isFile() || !entry.name.endsWith(".tsx")) continue;
      const content = await readFile(file, "utf8");
      for (const match of content.matchAll(/\bsourcePath:\s*['"](docs\/storybook\/patterns\/[^'"\r\n]+\.tsx)['"]/g))
        paths.add(match[1]);
    }
  }
  try {
    await visit(resolve(root, "docs/storybook/patterns"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return paths;
}

function isLoopback(host: string | undefined) {
  return (
    host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]" || host === "::ffff:127.0.0.1"
  );
}

type RunEditorCommand = (
  command: string,
  args: string[],
  options: { timeout: number },
  callback: (error: Error | null) => void,
) => void;

export function launchVsCode(file: string, run: RunEditorCommand = execFile): Promise<void> {
  return new Promise((accept, reject) => {
    run("code", ["--reuse-window", file], { timeout: 10_000 }, error => (error ? reject(error) : accept()));
  });
}

/** Only the dev server installs this handler; absolute paths never reach clients. */
export function createExampleSourceHandler(root: string, launch: (file: string) => Promise<void> = launchVsCode) {
  return async (request: IncomingMessage, response: ServerResponse) => {
    const reply = (status: number, message: string) => {
      response.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      response.end(JSON.stringify({ message }));
    };
    try {
      const protocol = "encrypted" in request.socket && request.socket.encrypted ? "https:" : "http:";
      const origin = new URL(`${protocol}//${request.headers.host}`);
      if (
        !isLoopback(request.socket.remoteAddress) ||
        !isLoopback(origin.hostname) ||
        request.headers.origin !== origin.origin ||
        Object.keys(request.headers).some(name => name.startsWith("x-forwarded-") || name === "forwarded")
      ) {
        reply(403, "Local same-origin access is required.");
        return;
      }
      if (request.method !== "POST") {
        reply(405, "Use POST.");
        return;
      }
      if (request.headers["content-type"]?.split(";")[0].trim() !== "application/json") {
        reply(415, "Use application/json.");
        return;
      }
      const chunks: Buffer[] = [];
      let length = 0;
      for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        length += buffer.length;
        if (length > 4096) {
          reply(413, "Request is too large.");
          return;
        }
        chunks.push(buffer);
      }
      let path: unknown;
      try {
        const body = Buffer.concat(chunks).toString("utf8");
        path = (JSON.parse(body) as { path?: unknown } | null)?.path;
      } catch {
        reply(400, "Invalid JSON.");
        return;
      }
      if (
        typeof path !== "string" ||
        path.includes("\\") ||
        path.split("/").some(segment => segment === ".." || segment === ".") ||
        !(await examplePaths(root)).has(path)
      ) {
        reply(400, "Unknown example source.");
        return;
      }
      const [realRoot, file] = await Promise.all([realpath(root), realpath(resolve(root, path))]);
      if (!inside(realRoot, file) || !(await stat(file)).isFile()) {
        reply(403, "Source must be inside the application.");
        return;
      }
      try {
        await launch(file);
      } catch {
        reply(503, "Unable to launch VSCode. Install its code command in the dev server PATH and try again.");
        return;
      }
      reply(200, "Opened example source.");
    } catch {
      reply(400, "Unable to resolve example source.");
    }
  };
}

export function patternExampleSource(): Plugin {
  let root = "";
  let endpoint: string | null = null;
  return {
    name: "pattern-example-source",
    config: {
      order: "post",
      async handler(config, environment) {
        root = resolve(config.root ?? process.cwd());
        if (!config.resolve?.preserveSymlinks) root = await realpath(root);
        const base = config.base?.startsWith(".") ? "/" : new URL(config.base || "/", "http://vite.dev").pathname;
        endpoint =
          environment.command === "serve" && !environment.isPreview
            ? `${base.replace(/\/?$/, "/")}${endpointName}`
            : null;
        const envDirectory = config.envDir === false ? false : resolve(root, config.envDir || ".");
        const env = loadEnv(environment.mode, envDirectory, "RGO_EXAMPLE_SOURCE_");
        return {
          define: {
            __RGO_EXAMPLE_SOURCE__: JSON.stringify({
              repositoryBaseUrl: resolveRepositoryBaseUrl(root, env.RGO_EXAMPLE_SOURCE_BASE_URL),
              editorEndpoint: endpoint,
            }),
          },
        };
      },
    },
    configResolved(config) {
      root = config.root;
    },
    configureServer(server) {
      const handler = createExampleSourceHandler(root);
      server.middlewares.use((request, response, next) => {
        if (!endpoint || request.url?.split("?")[0] !== endpoint) return next();
        void handler(request, response);
      });
    },
  };
}
