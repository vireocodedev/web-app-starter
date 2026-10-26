import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { assess, fields, prerequisites, schemaVersion } from "./schema.mjs";

const execute = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const defaultRoot = resolve(here, "../../../..");
const next =
  "Intake is not complete; run $initialization-intake to finish or resume intake before initialization execution.";
const rehearsalNext =
  "Dry-run intake is not complete; resume $initialization-intake dry run with the same session. This rehearsal cannot authorize initialization execution.";
const sha = (value) => createHash("sha256").update(value).digest("hex");
const stable = (value) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
        )
      : v,
  );
const plain = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const fail = (message) => {
  throw new Error(message);
};
const own = (object, allowed) => {
  if (
    !plain(object) ||
    Object.keys(object).some((key) => !allowed.includes(key))
  )
    fail("Unsupported input properties.");
};
function noSecrets(value) {
  if (
    typeof value === "string" &&
    /-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})|\bBearer\s+\S+|\b(?:password|token|secret|api[_-]?key)\s*[:=]\s*\S+|:\/\/[^\s/@:]+:[^\s/@]+@/i.test(
      value,
    )
  )
    fail(
      "Secret-like content rejected; use protected storage references only.",
    );
  if (Array.isArray(value)) value.forEach(noSecrets);
  else if (plain(value))
    for (const [key, item] of Object.entries(value)) {
      if (/^(?:password|token|secret|api[_-]?key|private[_-]?key)$/i.test(key))
        fail(
          "Secret fields are unsupported; use protected storage references only.",
        );
      noSecrets(item);
    }
}
async function statSafe(path, kind, privateMode = false) {
  const stat = await lstat(path);
  if (
    stat.isSymbolicLink() ||
    (kind === "directory" ? !stat.isDirectory() : !stat.isFile())
  )
    fail("Unsafe intake path; regular files and directories are required.");
  if (stat.uid !== process.getuid?.())
    fail("Intake path is not owned by the current user.");
  if (privateMode && stat.mode & 0o077)
    fail(
      "Intake state permissions must be private (directory 0700, files 0600).",
    );
  if (kind === "file" && stat.nlink !== 1)
    fail("Hard-linked intake files are unsupported.");
  return stat;
}
async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (e) {
    if (e.code === "ENOENT") return false;
    throw e;
  }
}
export async function workspace(selected = defaultRoot) {
  const { stateDirectories, ...target } = await resolveWorkspace(selected);
  return target;
}
function modeOptions(dryRun, session) {
  if (typeof dryRun !== "boolean") fail("dryRun must be a boolean.");
  if (!dryRun && session !== undefined) fail("A session requires --dry-run.");
  const selected = session === undefined ? "default" : session;
  if (
    dryRun &&
    (typeof selected !== "string" ||
      !/^[a-z0-9][a-z0-9-]{0,63}$/.test(selected))
  )
    fail(
      "Use a dry-run session name of 1–64 lowercase letters, digits or hyphens, starting with a letter or digit.",
    );
  return dryRun ? { dryRun: true, session: selected } : {};
}
async function resolveWorkspace(selected = defaultRoot, mode = {}) {
  const root = resolve(selected);
  if ((await realpath(root)) !== root)
    fail("Select the canonical consumer worktree path.");
  const { stdout: top } = await execute(
    "git",
    ["rev-parse", "--show-toplevel"],
    { cwd: root, timeout: 5000 },
  );
  if ((await realpath(top.trim())) !== root)
    fail("Select the consumer Git worktree root.");
  const { stdout: origin } = await execute(
    "git",
    ["remote", "get-url", "origin"],
    { cwd: root, timeout: 5000 },
  );
  const match = origin
    .trim()
    .match(
      /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?\/?$/,
    );
  if (!match) fail("Expected a credential-free GitHub consumer origin.");
  const name = match[1].toLowerCase();
  if (!mode.dryRun && name === "vireocodedev/web-app-starter")
    fail("The canonical template cannot be initialized as a consumer.");
  for (const segment of [".agents", "skills", "initialization-intake"]) {
    const parent =
      segment === ".agents"
        ? root
        : segment === "skills"
          ? join(root, ".agents")
          : join(root, ".agents", "skills");
    await statSafe(join(parent, segment), "directory");
  }
  const directory = join(
    root,
    ".agents",
    "skills",
    "initialization-intake",
    "state",
  );
  const stateDirectories = [directory];
  if (mode.dryRun)
    stateDirectories.push(
      join(directory, "dry-runs"),
      join(directory, "dry-runs", mode.session),
    );
  for (const path of stateDirectories) {
    if (!(await exists(path))) break;
    await statSafe(path, "directory", true);
  }
  const selectedDirectory = stateDirectories.at(-1);
  return {
    root,
    name,
    ...mode,
    stateDirectories,
    directory: selectedDirectory,
    path: join(selectedDirectory, "intake.json"),
  };
}
async function schemaDigest(root) {
  // Bind completion to the target consumer's installed schema and helper bytes.
  const target = join(
    root,
    ".agents",
    "skills",
    "initialization-intake",
    "scripts",
  );
  await statSafe(target, "directory");
  const bytes = [];
  for (const filename of ["schema.mjs", "intake.mjs"]) {
    await statSafe(join(target, filename), "file");
    bytes.push(await readFile(join(target, filename)));
    if (!(await readFile(join(here, filename))).equals(bytes.at(-1)))
      fail(
        "Installed intake helpers differ; run the helper bundled with this consumer.",
      );
  }
  return sha(Buffer.concat(bytes));
}
function validateShape(state, target) {
  own(state, [
    "schemaVersion",
    "schemaDigest",
    "repository",
    "revision",
    "answers",
    "prerequisites",
    "completion",
    "dryRun",
  ]);
  if (Object.hasOwn(state, "dryRun")) {
    if (!target.dryRun)
      fail(
        "Dry-run intake cannot be used for initialization execution; finish real intake separately.",
      );
    own(state.dryRun, ["session"]);
    if (state.dryRun.session !== target.session)
      fail("Dry-run intake session does not match the selected session.");
  } else if (target.dryRun) {
    fail(
      "Real intake cannot be used as dry-run state; start a separate rehearsal.",
    );
  }
  own(state.repository, ["root", "name"]);
  if (
    state.schemaVersion !== schemaVersion ||
    !Number.isSafeInteger(state.revision) ||
    state.revision < 0 ||
    !plain(state.answers) ||
    !plain(state.prerequisites)
  )
    fail("Invalid intake state format.");
  for (const [id, answer] of Object.entries(state.answers)) {
    if (!Object.hasOwn(fields, id)) fail("Unknown intake question.");
    own(answer, ["status", "value"]);
    if (
      !["answered", "proposed", "unknown"].includes(answer.status) ||
      (answer.status !== "unknown" && !Object.hasOwn(answer, "value"))
    )
      fail("Invalid answer status or missing value.");
  }
  for (const [id, p] of Object.entries(state.prerequisites)) {
    if (!Object.hasOwn(prerequisites, id)) fail("Unknown intake prerequisite.");
    own(p, ["status", "evidence"]);
    if (
      !["ready", "blocked", "unknown"].includes(p.status) ||
      (p.evidence !== undefined &&
        (typeof p.evidence !== "string" || p.evidence.length > 2000))
    )
      fail("Invalid prerequisite status or evidence.");
  }
  if (state.completion !== null) {
    own(state.completion, ["digest", "confirmedAt", "confirmation"]);
    own(state.completion.confirmation, ["response"]);
    if (
      typeof state.completion.digest !== "string" ||
      typeof state.completion.confirmedAt !== "string" ||
      typeof state.completion.confirmation.response !== "string" ||
      !state.completion.confirmation.response.trim()
    )
      fail("Invalid completion receipt.");
  }
  noSecrets(state);
}
function digest(state) {
  return sha(stable({ ...state, completion: null }));
}
async function load(target, currentSchema, allowStale = false) {
  if (!(await exists(target.path))) return null;
  await statSafe(target.path, "file", true);
  let state;
  try {
    state = JSON.parse(await readFile(target.path, "utf8"));
  } catch {
    fail(
      "Invalid intake JSON; preserve it and reconcile through $initialization-intake.",
    );
  }
  validateShape(state, target);
  if (
    state.repository.root !== target.root ||
    state.repository.name !== target.name
  )
    fail(
      "Intake belongs to a different repository/worktree; preserve and reconcile it.",
    );
  if (state.schemaDigest !== currentSchema && !allowStale)
    fail(
      "Intake schema/helpers changed; preserve answers and reconcile through $initialization-intake before completing again.",
    );
  return state;
}
function report(state, target) {
  if (!state)
    return {
      complete: false,
      statePath: target.path,
      reason: "missing",
      ...(target.dryRun
        ? {
            dryRun: true,
            session: target.session,
            rehearsalComplete: false,
            next: rehearsalNext,
          }
        : { next }),
    };
  const issues = assess(state, { dryRun: Boolean(target.dryRun) });
  const complete =
    [...issues.missing, ...issues.invalid, ...issues.blocked].length === 0 &&
    Boolean(state.completion) &&
    state.completion.digest === digest(state);
  return {
    complete: target.dryRun ? false : complete,
    ...(target.dryRun
      ? {
          dryRun: true,
          session: target.session,
          rehearsalComplete: complete,
        }
      : {}),
    statePath: target.path,
    revision: state.revision,
    repository: state.repository,
    scope: state.answers.execution_scope?.value,
    ...issues,
    answered: Object.keys(state.answers).filter(
      (id) => state.answers[id].status === "answered",
    ),
    proposed: Object.keys(state.answers).filter(
      (id) => state.answers[id].status === "proposed",
    ),
    ...(complete
      ? target.dryRun
        ? { rehearsalDigest: state.completion.digest }
        : { digest: state.completion.digest }
      : { next: target.dryRun ? rehearsalNext : next }),
  };
}
async function write(target, state) {
  const temporary = join(target.directory, `.intake-${randomUUID()}.tmp`);
  const file = await open(
    temporary,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      constants.O_NOFOLLOW,
    0o600,
  );
  try {
    await file.writeFile(JSON.stringify(state, null, 2) + "\n");
    await file.sync();
  } finally {
    await file.close();
  }
  try {
    await rename(temporary, target.path);
  } finally {
    await unlink(temporary).catch((e) => {
      if (e.code !== "ENOENT") throw e;
    });
  }
}
export async function run(
  command,
  { root = defaultRoot, input, dryRun = false, session } = {},
) {
  if (
    !["init", "status", "save", "complete", "require-complete"].includes(
      command,
    )
  )
    fail("Use init, status, save, complete or require-complete.");
  const mode = modeOptions(dryRun, session);
  if (dryRun && command === "require-complete")
    fail(
      "Dry-run intake cannot satisfy require-complete or authorize initialization execution; finish real intake separately.",
    );
  const target = await resolveWorkspace(root, mode);
  const currentSchema = await schemaDigest(target.root);
  if (["status", "require-complete"].includes(command)) {
    const result = report(await load(target, currentSchema), target);
    if (command === "require-complete" && !result.complete) {
      const blockers = ["missing", "invalid", "blocked"]
        .filter((kind) => result[kind]?.length)
        .map((kind) => `${kind}: ${result[kind].join(", ")}`);
      fail(
        `${next}${result.reason ? ` Reason: ${result.reason}.` : ""}${blockers.length ? ` ${blockers.join("; ")}.` : ""}`,
      );
    }
    return result;
  }
  for (const directory of target.stateDirectories) {
    if (!(await exists(directory))) {
      try {
        await mkdir(directory, { mode: 0o700 });
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
      }
    }
    await statSafe(directory, "directory", true);
  }
  const lockPath = join(target.directory, ".write-lock");
  let lock;
  try {
    lock = await open(
      lockPath,
      constants.O_WRONLY |
        constants.O_CREAT |
        constants.O_EXCL |
        constants.O_NOFOLLOW,
      0o600,
    );
  } catch (e) {
    if (e.code === "EEXIST")
      fail(
        "Another intake writer or interrupted lock exists; inspect it before retrying.",
      );
    throw e;
  }
  try {
    let state = await load(target, currentSchema, command === "save");
    if (command === "init") {
      if (state) return report(state, target);
      state = {
        schemaVersion,
        schemaDigest: currentSchema,
        repository: { root: target.root, name: target.name },
        ...(target.dryRun ? { dryRun: { session: target.session } } : {}),
        revision: 0,
        answers: {},
        prerequisites: {},
        completion: null,
      };
    } else {
      if (!state) fail(target.dryRun ? rehearsalNext : next);
      own(
        input,
        command === "save"
          ? ["expectedRevision", "answers", "prerequisites"]
          : ["expectedRevision", "confirmation"],
      );
      noSecrets(input);
      if (input.expectedRevision !== state.revision)
        fail(
          "Intake revision conflict; reload status/state and merge answers before retrying.",
        );
      if (command === "save") {
        if (
          (input.answers !== undefined && !plain(input.answers)) ||
          (input.prerequisites !== undefined && !plain(input.prerequisites))
        )
          fail("Answer and prerequisite patches must be objects.");
        state = {
          ...state,
          schemaDigest: currentSchema,
          revision: state.revision + 1,
          answers: { ...state.answers, ...input.answers },
          prerequisites: {
            ...state.prerequisites,
            ...input.prerequisites,
          },
          completion: null,
        };
        validateShape(state, target);
      } else {
        own(input.confirmation, ["response"]);
        const response = input.confirmation.response;
        if (
          typeof response !== "string" ||
          !response.trim() ||
          response.length > 2000
        )
          fail(
            "Record the actual user response confirming the displayed scope.",
          );
        const issues = assess(state, { dryRun });
        if ([...issues.missing, ...issues.invalid, ...issues.blocked].length)
          fail(target.dryRun ? rehearsalNext : next);
        state = {
          ...state,
          revision: state.revision + 1,
          completion: null,
        };
        state.completion = {
          digest: digest(state),
          confirmedAt: new Date().toISOString(),
          confirmation: { response },
        };
      }
    }
    await write(target, state);
    return report(state, target);
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  let root = defaultRoot;
  let inputPath;
  let dryRun = false;
  let session;
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (
      !["--root", "--input", "--dry-run", "--session"].includes(flag) ||
      seen.has(flag)
    )
      fail(
        "Use --root PATH, optional --input FILE (or - for stdin), and --dry-run with optional --session NAME.",
      );
    seen.add(flag);
    if (flag === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (!args[i + 1] || args[i + 1].startsWith("--"))
      fail("Expected a value for the selected intake option.");
    if (flag === "--root") root = resolve(args[++i]);
    else if (flag === "--session") session = args[++i];
    else inputPath = args[++i];
  }
  modeOptions(dryRun, session);
  let input;
  if (inputPath) {
    let bytes;
    if (inputPath === "-") {
      bytes = "";
      for await (const chunk of process.stdin) bytes += chunk;
    } else {
      await statSafe(resolve(inputPath), "file", true);
      bytes = await readFile(inputPath, "utf8");
    }
    try {
      input = JSON.parse(bytes);
    } catch {
      fail("Invalid JSON input; values were not echoed.");
    }
  }
  const result = await run(command, { root, input, dryRun, session });
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    // Provider/Git errors may include URLs; only expose our deliberately bounded diagnostics.
    const message =
      error instanceof Error && !error.code && !error.cmd
        ? error.message
        : "Local intake inspection failed; verify consumer Git metadata and protected files.";
    process.stderr.write(
      message +
        "\n" +
        (process.argv.includes("--dry-run") ? rehearsalNext : next) +
        "\n",
    );
    process.exitCode = 1;
  });
}
