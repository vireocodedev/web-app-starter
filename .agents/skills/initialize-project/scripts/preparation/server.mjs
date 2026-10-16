import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { constants } from "node:fs";
import { lstat, mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";
import { promisify } from "node:util";
import {
  assertDraft,
  emptyDraft,
  importWorkbook,
  parseTemplate,
  renderWorkbook,
  validatePreparation,
} from "./model.mjs";
import { defaultRoot, skillDirectory, verifyWorkspace } from "../workspace.mjs";

const execute = promisify(execFile);
const digest = (value) =>
  value === null ? null : createHash("sha256").update(value).digest("hex");
const filenames = new Set([
  "preparation-draft.json",
  "preparation.md",
  "preparation-launch.html",
  "preparation-session.json",
  "preparation-server.lock",
]);

class RequestError extends Error {
  constructor(status, message, issues) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

function privateJson(value, label) {
  try {
    return JSON.parse(value);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new RequestError(
      422,
      `The private ${label} JSON is invalid; its contents were preserved.`,
    );
  }
}

async function optionalFile(path) {
  try {
    const info = await lstat(path);
    if (
      !info.isFile() ||
      info.isSymbolicLink() ||
      info.uid !== process.getuid() ||
      info.mode & 0o077
    )
      throw new RequestError(
        403,
        "Private preparation files must be regular, user-owned and mode 0600.",
      );
    if (info.size > 131072)
      throw new RequestError(
        413,
        "Private preparation file is unexpectedly large.",
      );
    return await readFile(path);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function contextFor(root, stateDirectory) {
  let repository = null;
  try {
    const { stdout } = await execute("git", ["remote", "get-url", "origin"], {
      cwd: root,
      timeout: 5000,
    });
    const match =
      /^(?:https:\/\/(?:[^/@]+@)?github\.com\/|git@github\.com:)([a-z\d-]+\/[a-z\d_.-]+?)(?:\.git)?\s*$/i.exec(
        stdout,
      );
    repository = match?.[1] ?? null;
  } catch (error) {
    if (error.code !== 2 && error.code !== 1 && error.code !== "ENOENT")
      throw error;
  }
  const state = await optionalFile(join(stateDirectory, "state.json"));
  const previous = state ? privateJson(state, "initialization state") : null;
  if (
    state &&
    (!previous || typeof previous !== "object" || Array.isArray(previous))
  )
    throw new RequestError(
      422,
      "The existing initialization state is not an object.",
    );
  return { repository, completed: previous?.completion?.status === "ready" };
}

export async function startPreparationServer({
  root = defaultRoot,
  port = 0,
} = {}) {
  if (process.platform !== "linux")
    throw new Error(
      "Preparation currently requires Linux owner-only file permissions.",
    );
  root = await verifyWorkspace(root);
  const privateFiles = [...filenames, "state.json", "readiness.md"].map(
    (name) => `.template-initialization/${name}`,
  );
  const ignored = await execute(
    "git",
    ["check-ignore", "--", ...privateFiles],
    {
      cwd: root,
      timeout: 5000,
    },
  ).catch((error) => {
    if (error.code === 1)
      throw new Error(
        "Ignore /.template-initialization/ in this consumer before starting private preparation.",
      );
    throw error;
  });
  if (ignored.stdout.trim().split("\n").length !== privateFiles.length)
    throw new Error(
      "Ignore the entire /.template-initialization/ directory before starting private preparation.",
    );
  const stateDirectory = join(root, ".template-initialization");
  try {
    await mkdir(stateDirectory, { mode: 0o700 });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  const protectDirectory = async () => {
    const info = await lstat(stateDirectory);
    if (
      !info.isDirectory() ||
      info.isSymbolicLink() ||
      info.uid !== process.getuid() ||
      info.mode & 0o077
    )
      throw new RequestError(
        403,
        "Use a user-owned mode 0700 .template-initialization directory.",
      );
  };
  await protectDirectory();
  const templatePath = join(skillDirectory, "references/preparation.md");
  const schema = parseTemplate(await readFile(templatePath, "utf8"));
  const context = await contextFor(root, stateDirectory);
  const assets = new Map(
    await Promise.all(
      [
        ["", "index.html", "text/html"],
        ["client.mjs", "client.mjs", "text/javascript"],
        ["model.mjs", "model.mjs", "text/javascript"],
        ["styles.css", "styles.css", "text/css"],
      ].map(async ([route, filename, type]) => [
        route,
        {
          content: await readFile(
            join(
              skillDirectory,
              filename === "model.mjs"
                ? "scripts/preparation/model.mjs"
                : `web/${filename}`,
            ),
            "utf8",
          ),
          type,
        },
      ]),
    ),
  );
  const privatePath = (name) => {
    if (!filenames.has(name))
      throw new Error("Unsupported private preparation filename");
    return join(stateDirectory, name);
  };
  const read = async (name) => {
    await protectDirectory();
    return optionalFile(privatePath(name));
  };
  const write = async (name, content, expected) => {
    await protectDirectory();
    if (digest(await read(name)) !== expected)
      throw new RequestError(
        409,
        "This file changed. Reload before saving; existing data was preserved.",
      );
    const temporary = join(
      stateDirectory,
      `.preparation-pending-${randomUUID()}`,
    );
    try {
      const stream = await open(
        temporary,
        constants.O_WRONLY |
          constants.O_CREAT |
          constants.O_EXCL |
          constants.O_NOFOLLOW,
        0o600,
      );
      try {
        await stream.writeFile(content);
        await stream.sync();
      } finally {
        await stream.close();
      }
      await protectDirectory();
      if (digest(await read(name)) !== expected)
        throw new RequestError(
          409,
          "This file changed during saving; existing data was preserved.",
        );
      await rename(temporary, privatePath(name));
      const parent = await open(
        stateDirectory,
        constants.O_RDONLY | constants.O_DIRECTORY,
      );
      try {
        await parent.sync();
      } finally {
        await parent.close();
      }
    } finally {
      try {
        await unlink(temporary);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
  };
  const lock = await open(
    privatePath("preparation-server.lock"),
    "wx",
    0o600,
  ).catch((error) => {
    if (error.code === "EEXIST")
      throw new RequestError(
        409,
        "A preparation server lock already exists. Stop that server, or verify its recorded PID before removing only its stale lock.",
      );
    throw error;
  });
  const instance = randomUUID();
  const lockContents = JSON.stringify({ pid: process.pid, instance });
  await lock.writeFile(lockContents);
  await lock.close();
  const owned = new Map([["preparation-server.lock", digest(lockContents)]]);
  const capability = randomBytes(32).toString("hex");
  const prefix = `/prepare/${capability}/`;
  let origin,
    busy = false;
  const respond = (
    response,
    code,
    body,
    type = "application/json",
    reference = false,
  ) => {
    response.writeHead(code, {
      "Content-Type": `${type}; charset=utf-8`,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Content-Security-Policy": reference
        ? "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"
        : "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    });
    response.end(type === "application/json" ? JSON.stringify(body) : body);
  };
  const body = async (request) => {
    if (request.headers["content-type"]?.split(";")[0] !== "application/json")
      throw new RequestError(415, "Use application/json.");
    if (Number(request.headers["content-length"]) > 131072)
      throw new RequestError(413, "Request too large.");
    const chunks = [];
    let bytes = 0;
    for await (const chunk of request) {
      bytes += chunk.length;
      if (bytes > 131072) throw new RequestError(413, "Request too large.");
      chunks.push(chunk);
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      throw new RequestError(400, "Invalid JSON.");
    }
  };
  const snapshot = async () => {
    const saved = await read("preparation-draft.json");
    const workbook = await read("preparation.md");
    let draft;
    try {
      draft = saved
        ? privateJson(saved, "draft")
        : workbook
          ? importWorkbook(schema, workbook.toString("utf8"))
          : emptyDraft(schema, context.repository);
      assertDraft(schema, draft);
    } catch (error) {
      throw new RequestError(
        422,
        `Existing preparation needs reconciliation: ${error.message}`,
      );
    }
    return {
      schema,
      context,
      draft,
      revision: digest(saved),
      workbookHash: digest(workbook),
      workbookExists: workbook !== null,
    };
  };
  const requestHandler = async (request, response) => {
    if (request.headers.host !== new URL(origin).host)
      throw new RequestError(403, "Unexpected Host.");
    const url = new URL(request.url, origin);
    if (url.origin !== origin)
      throw new RequestError(403, "Unexpected request origin.");
    const segments = url.pathname.split("/");
    const offered = Buffer.from(segments[2] ?? "");
    if (
      segments[1] !== "prepare" ||
      offered.length !== capability.length ||
      !timingSafeEqual(offered, Buffer.from(capability))
    )
      throw new RequestError(404, "Open the protected preparation launcher.");
    if (!url.pathname.startsWith(prefix))
      throw new RequestError(404, "Unknown route.");
    const route = url.pathname.slice(prefix.length);
    if (request.method === "GET" && assets.has(route)) {
      const asset = assets.get(route);
      respond(response, 200, asset.content, asset.type);
      return;
    }
    if (request.method === "GET" && route === "reference") {
      const html = await readFile(
        join(skillDirectory, "web/reference.html"),
        "utf8",
      );
      respond(response, 200, html, "text/html", true);
      return;
    }
    if (request.method === "GET" && route === "api/state") {
      respond(response, 200, await snapshot());
      return;
    }
    if (
      !["PUT", "POST"].includes(request.method) ||
      !["api/draft", "api/workbook"].includes(route)
    )
      throw new RequestError(405, "Unsupported preparation operation.");
    if (request.headers.origin !== origin)
      throw new RequestError(
        403,
        "Preparation writes require the exact local origin.",
      );
    if (
      (route === "api/draft" && request.method !== "PUT") ||
      (route === "api/workbook" && request.method !== "POST")
    )
      throw new RequestError(405, "Unsupported method.");
    if (busy)
      throw new RequestError(
        409,
        "Another save is in progress. Retry after it completes.",
      );
    busy = true;
    try {
      const input = await body(request);
      if (!input || typeof input !== "object" || Array.isArray(input))
        throw new RequestError(400, "A JSON object is required.");
      const state = await snapshot();
      if (input.revision !== state.revision)
        throw new RequestError(
          409,
          "Draft changed in another tab. Reload before saving.",
        );
      if (route === "api/draft") {
        if (
          Object.keys(input).sort().join() !==
          ["draft", "revision"].sort().join()
        )
          throw new RequestError(400, "Unexpected draft properties.");
        try {
          assertDraft(schema, input.draft);
        } catch (error) {
          throw new RequestError(422, error.message);
        }
        const content = JSON.stringify(input.draft) + "\n";
        await write("preparation-draft.json", content, state.revision);
        respond(response, 200, { revision: digest(content) });
      } else {
        if (
          Object.keys(input).sort().join() !==
          ["revision", "reviewed", "replaceExisting", "expectedWorkbookHash"]
            .sort()
            .join()
        )
          throw new RequestError(400, "Unexpected workbook properties.");
        if (input.reviewed !== true)
          throw new RequestError(
            422,
            "Review and explicitly confirm this exact workbook before saving.",
          );
        if ((await readFile(templatePath, "utf8")) !== schema.markdown)
          throw new RequestError(
            409,
            "The preparation guide changed. Restart the wizard and review it before saving; existing files were preserved.",
          );
        if (input.expectedWorkbookHash !== state.workbookHash)
          throw new RequestError(
            409,
            "The existing workbook changed; reload and review it.",
          );
        if (state.workbookExists && input.replaceExisting !== true)
          throw new RequestError(
            409,
            "Confirm replacement of the existing workbook; it has not been overwritten.",
          );
        const issues = validatePreparation(schema, state.draft, context);
        if (Object.keys(issues).length)
          throw new RequestError(
            422,
            "Complete or correct the preparation items before saving.",
            issues,
          );
        const content = renderWorkbook(schema, state.draft);
        await write("preparation.md", content, state.workbookHash);
        respond(response, 200, {
          path: ".template-initialization/preparation.md",
          workbookHash: digest(content),
          mode: state.draft.answers.execution_mode,
          message:
            "Workbook saved privately. Invoke /initialize-project; live readiness and current authority are still verified by the skill.",
        });
      }
    } finally {
      busy = false;
    }
  };
  const server = createServer((request, response) => {
    requestHandler(request, response).catch((error) => {
      if (!(error instanceof RequestError))
        console.error("Preparation request failed:", error.code ?? error.name);
      if (!response.headersSent && !response.destroyed)
        respond(response, error.status ?? 500, {
          error:
            error instanceof RequestError
              ? error.message
              : "Local preparation operation failed. See the server terminal.",
          issues: error.issues,
        });
    });
  });
  const cleanup = async () => {
    const lockData = await read("preparation-server.lock");
    if (
      lockData === null ||
      digest(lockData) !== owned.get("preparation-server.lock")
    )
      throw new Error("Preparation lock ownership changed; refusing cleanup");
    for (const name of [
      "preparation-launch.html",
      "preparation-session.json",
      "preparation-server.lock",
    ].filter((name) => owned.has(name))) {
      const data = await read(name);
      if (data === null) continue;
      if (digest(data) !== owned.get(name))
        throw new Error("Preparation runtime file changed; refusing cleanup");
      await unlink(privatePath(name));
    }
  };
  try {
    await new Promise((accept, reject) => {
      server.once("error", reject);
      server.listen(port, "127.0.0.1", accept);
    });
    origin = `http://127.0.0.1:${server.address().port}`;
    const url = origin + prefix;
    const session = JSON.stringify({ pid: process.pid, instance, url }) + "\n";
    await write(
      "preparation-session.json",
      session,
      digest(await read("preparation-session.json")),
    );
    owned.set("preparation-session.json", digest(session));
    const launcher = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="refresh" content="0;url=${url}"><title>Open preparation</title><a href="${url}">Continue to the private local preparation wizard</a></html>\n`;
    await write(
      "preparation-launch.html",
      launcher,
      digest(await read("preparation-launch.html")),
    );
    owned.set("preparation-launch.html", digest(launcher));
    return {
      server,
      url,
      origin,
      launcher: privatePath("preparation-launch.html"),
      stateDirectory,
      close: async () => {
        await new Promise((accept, reject) =>
          server.close((error) => (error ? reject(error) : accept())),
        );
        await cleanup();
      },
    };
  } catch (error) {
    if (server.listening) await new Promise((accept) => server.close(accept));
    await cleanup();
    throw error;
  }
}

export async function startPreparationCli({
  root = defaultRoot,
  openBrowser = true,
} = {}) {
  const app = await startPreparationServer({ root });
  console.log(
    `Preparation wizard is listening on ${app.origin} (loopback only).`,
  );
  console.log(`Open the private launcher in your browser: ${app.launcher}`);
  console.log(
    "Keep this terminal running. Drafts/workbook are private; no provider actions are executed.",
  );
  if (openBrowser) {
    const opener = spawn("xdg-open", [app.launcher], { stdio: "ignore" });
    opener.once("error", (error) =>
      console.error(
        `Browser opener failed (${error.code}); open the private launcher manually.`,
      ),
    );
    opener.once("exit", (code) => {
      if (code)
        console.error(
          `Browser opener exited ${code}; open the private launcher manually.`,
        );
    });
  }
  let stopping = false;
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, async () => {
      if (stopping) return;
      stopping = true;
      try {
        await app.close();
        process.exitCode = 0;
      } catch (error) {
        console.error("Preparation shutdown failed:", error.code ?? error.name);
        process.exitCode = 1;
      }
    });
}
