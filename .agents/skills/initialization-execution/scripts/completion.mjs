import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  run as intake,
  workspace,
} from "../../initialization-intake/scripts/intake.mjs";

const execute = promisify(execFile);
const defaultRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);
export const completionNext =
  "Full initialization is not complete; finish $initialization-execution before $specification-creator.";
export const completionPhases = {
  intake: ["confirmedScope", "readiness"],
  identity: ["applicationIdentity", "templateReferences"],
  local: [
    "checks",
    "nativeApi",
    "browserAuthentication",
    "frontendIdeLaunch",
    "backendIdeLaunch",
  ],
  ci: [
    "registration",
    "isolation",
    "workflow",
    "mainProtection",
    "failingGate",
    "passingGate",
  ],
  environments: [
    "dns",
    "tls",
    "databaseIsolation",
    "credentialIsolation",
    "controller",
  ],
  staging: ["workflow", "runtime", "browserAuthentication"],
  production: ["promotion", "freshBackup", "runtime", "browserAuthentication"],
  recovery: [
    "provisioning",
    "initializedDump",
    "retrieval",
    "checksum",
    "isolatedRestore",
    "restoredData",
    "scratchCleanup",
    "productionTimer",
  ],
  handoff: ["operatingDocumentation", "protectedReferences"],
};
const fail = (reason) => {
  throw new Error(reason);
};
const plain = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const sha = (value) => createHash("sha256").update(value).digest("hex");
const stable = (value) =>
  JSON.stringify(value, (_, item) =>
    plain(item)
      ? Object.fromEntries(
          Object.entries(item).sort(([a], [b]) => a.localeCompare(b)),
        )
      : item,
  );
const hash = (value) =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const commit = (value) =>
  typeof value === "string" && /^[a-f0-9]{40}$/.test(value);
const receiptDigest = (value) => sha(stable({ ...value, digest: null }));
function shape(value, keys) {
  if (
    !plain(value) ||
    Object.keys(value).length !== keys.length ||
    keys.some((key) => !Object.hasOwn(value, key))
  )
    fail("Incomplete or unsupported completion evidence fields.");
}
function noSecrets(value) {
  if (
    typeof value === "string" &&
    /-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})|\bBearer\s+\S+|\b(?:password|token|secret|api[_-]?key)\s*[:=]\s*\S+|:\/\/[^\s/@:]+:[^\s/@]+@/i.test(
      value,
    )
  )
    fail(
      "Secret-like completion evidence rejected; use opaque protected references.",
    );
  if (Array.isArray(value)) value.forEach(noSecrets);
  else if (plain(value)) Object.values(value).forEach(noSecrets);
}
function evidenceReference(value, repository) {
  if (typeof value !== "string" || value.length > 400)
    fail("Invalid completion evidence reference.");
  const runPrefix = `https://github.com/${repository}/actions/runs/`;
  if (
    value.startsWith(runPrefix) &&
    /^\d+(?:\/attempts\/\d+)?$/.test(value.slice(runPrefix.length))
  )
    return;
  if (
    /^private:[a-zA-Z0-9][a-zA-Z0-9._/-]{0,160}$/.test(value) &&
    !value.includes("..")
  )
    return;
  if (
    /^(?:docs|infrastructure)\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(value) &&
    !value.includes("..")
  )
    return;
  fail(
    "Use a consumer workflow URL, repository evidence path or opaque private: reference.",
  );
}
function environment(value, receipt) {
  shape(value, ["url", "runUrl", "sourceCommit", "frontend", "backend"]);
  if (typeof value.url !== "string") fail("Invalid environment HTTPS URL.");
  let url;
  try {
    url = new URL(value.url);
  } catch {
    fail("Invalid environment HTTPS URL.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    url.port
  )
    fail("Use credential-free environment HTTPS origins.");
  if (value.sourceCommit !== receipt.sourceCommit)
    fail("Deployment source does not match initialization source.");
  evidenceReference(value.runUrl, receipt.repository);
  if (
    !value.runUrl.startsWith(
      `https://github.com/${receipt.repository}/actions/runs/`,
    )
  )
    fail("Deployment requires its consumer workflow run URL.");
  for (const component of ["frontend", "backend"]) {
    const prefix = `ghcr.io/${receipt.repository}-${component}@sha256:`;
    if (
      typeof value[component] !== "string" ||
      !value[component].startsWith(prefix) ||
      !hash(value[component].slice(prefix.length))
    )
      fail("Use this consumer's immutable frontend/backend GHCR digests.");
  }
}

// Validates recorded observations, not live providers or authenticity of an operator's claims.
export function assessFullInitializationReceipt(receipt) {
  shape(receipt, [
    "schemaVersion",
    "repository",
    "scope",
    "sourceCommit",
    "intake",
    "completedAt",
    "phases",
    "deployments",
    "recovery",
    "digest",
  ]);
  noSecrets(receipt);
  if (
    receipt.schemaVersion !== 1 ||
    receipt.scope !== "full" ||
    !commit(receipt.sourceCommit) ||
    typeof receipt.repository !== "string" ||
    !/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/.test(receipt.repository) ||
    receipt.repository === "vireocodedev/web-app-starter"
  )
    fail("A versioned full consumer initialization receipt is required.");
  if (
    typeof receipt.completedAt !== "string" ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(receipt.completedAt) ||
    !Number.isFinite(Date.parse(receipt.completedAt))
  )
    fail("Missing completion observation time.");
  shape(receipt.intake, ["revision", "digest"]);
  if (
    !Number.isSafeInteger(receipt.intake.revision) ||
    receipt.intake.revision < 1 ||
    !hash(receipt.intake.digest)
  )
    fail("Missing completed full intake identity.");
  shape(receipt.phases, Object.keys(completionPhases));
  for (const [id, required] of Object.entries(completionPhases)) {
    const phase = receipt.phases[id];
    shape(phase, ["status", "evidence"]);
    if (phase.status !== "passed")
      fail(`Initialization phase ${id} is not passed.`);
    shape(phase.evidence, required);
    for (const reference of Object.values(phase.evidence))
      evidenceReference(reference, receipt.repository);
  }
  shape(receipt.deployments, ["staging", "production"]);
  for (const deployment of Object.values(receipt.deployments))
    environment(deployment, receipt);
  const { staging, production } = receipt.deployments;
  if (new URL(staging.url).hostname === new URL(production.url).hostname)
    fail("Staging and production must have distinct hosts.");
  if (
    staging.frontend !== production.frontend ||
    staging.backend !== production.backend
  )
    fail("Production must promote the identical accepted staging image pair.");
  shape(receipt.recovery, [
    "initialized",
    "isolated",
    "backupSha256",
    "retrievedSha256",
    "restoredSha256",
  ]);
  if (
    receipt.recovery.initialized !== true ||
    receipt.recovery.isolated !== true ||
    !hash(receipt.recovery.backupSha256) ||
    receipt.recovery.backupSha256 !== receipt.recovery.retrievedSha256 ||
    receipt.recovery.backupSha256 !== receipt.recovery.restoredSha256
  )
    fail(
      "Initialized isolated restore must use the checksum-matched retrieved production backup.",
    );
  if (!hash(receipt.digest) || receipt.digest !== receiptDigest(receipt))
    fail("Initialization receipt integrity mismatch.");
  return receipt;
}

async function safe(path, directory = false, privateMode = false) {
  const info = await lstat(path);
  if (
    info.isSymbolicLink() ||
    (directory ? !info.isDirectory() : !info.isFile()) ||
    (!directory && info.nlink !== 1) ||
    info.uid !== process.getuid?.()
  )
    fail("Unsafe completion evidence path.");
  if (privateMode && info.mode & 0o077)
    fail("Completion state must use owner-only permissions.");
}
async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}
async function paths(root, create = false) {
  const target = await workspace(root);
  const privateDirectory = join(target.root, ".template-initialization");
  for (const [path, privateMode] of [
    [join(target.root, "docs"), false],
    [join(target.root, "docs", "acceptance"), false],
    [privateDirectory, true],
  ]) {
    if (create && !(await exists(path)))
      await mkdir(path, { mode: privateMode ? 0o700 : 0o755 });
    await safe(path, true, privateMode);
  }
  return {
    ...target,
    privateDirectory,
    acceptancePath: join(
      target.root,
      "docs/acceptance/initialization-acceptance.json",
    ),
    markerPath: join(privateDirectory, "completion.json"),
  };
}
async function readJson(path, privateMode = false) {
  await safe(path, false, privateMode);
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    if ((await file.stat()).size > 128 * 1024)
      fail("Completion evidence exceeds its bounded size.");
    try {
      return JSON.parse(await file.readFile("utf8"));
    } catch {
      fail("Invalid completion evidence JSON.");
    }
  } finally {
    await file.close();
  }
}
async function sourceExists(root, sourceCommit) {
  try {
    await execute("git", ["cat-file", "-e", `${sourceCommit}^{commit}`], {
      cwd: root,
      timeout: 5000,
    });
    await execute(
      "git",
      ["merge-base", "--is-ancestor", sourceCommit, "HEAD"],
      { cwd: root, timeout: 5000 },
    );
  } catch {
    fail(
      "Initialization source must be an available commit in this consumer's history; reconcile shallow or rewritten history.",
    );
  }
}
function summary(target, receipt) {
  return {
    repository: receipt.repository,
    scope: "full",
    sourceCommit: receipt.sourceCommit,
    acceptancePath: target.acceptancePath,
    digest: receipt.digest,
  };
}
export async function requireFullInitialization(root = defaultRoot) {
  try {
    const target = await paths(root);
    const receipt = assessFullInitializationReceipt(
      await readJson(target.acceptancePath),
    );
    const marker = await readJson(target.markerPath, true);
    shape(marker, [
      "schemaVersion",
      "root",
      "repository",
      "sourceCommit",
      "digest",
    ]);
    if (
      marker.schemaVersion !== 1 ||
      marker.root !== target.root ||
      marker.repository !== target.name ||
      receipt.repository !== target.name ||
      marker.sourceCommit !== receipt.sourceCommit ||
      marker.digest !== receipt.digest
    )
      fail(
        "Completion evidence belongs to another consumer/worktree or has changed.",
      );
    await sourceExists(target.root, receipt.sourceCommit);
    return summary(target, receipt);
  } catch (error) {
    const reason =
      error instanceof Error && !error.code && !error.cmd
        ? error.message
        : "Missing or unreadable consumer completion evidence.";
    throw new Error(`${completionNext} ${reason}`);
  }
}
async function atomic(path, value, mode) {
  const temporary = join(dirname(path), `.completion-${randomUUID()}.tmp`);
  const file = await open(
    temporary,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      constants.O_NOFOLLOW,
    mode,
  );
  try {
    await file.writeFile(JSON.stringify(value, null, 2) + "\n");
    await file.sync();
  } finally {
    await file.close();
  }
  try {
    await rename(temporary, path);
    const directory = await open(dirname(path), constants.O_RDONLY);
    try {
      await directory.sync();
    } finally {
      await directory.close();
    }
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}
export async function completeFullInitialization(root = defaultRoot, input) {
  const confirmed = await intake("require-complete", { root });
  if (confirmed.scope !== "full") fail(completionNext);
  shape(input, ["sourceCommit", "phases", "deployments", "recovery"]);
  const receipt = {
    schemaVersion: 1,
    repository: confirmed.repository.name,
    scope: "full",
    sourceCommit: input.sourceCommit,
    intake: { revision: confirmed.revision, digest: confirmed.digest },
    completedAt: new Date().toISOString(),
    phases: input.phases,
    deployments: input.deployments,
    recovery: input.recovery,
    digest: null,
  };
  receipt.digest = receiptDigest(receipt);
  assessFullInitializationReceipt(receipt);
  await sourceExists(confirmed.repository.root, receipt.sourceCommit);
  const target = await paths(root, true);
  const lockPath = join(target.privateDirectory, ".completion-lock");
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
  } catch {
    fail(
      "Another completion writer or interrupted lock exists; inspect before retrying.",
    );
  }
  try {
    for (const [path, privateMode] of [
      [target.acceptancePath, false],
      [target.markerPath, true],
    ])
      if (await exists(path)) await safe(path, false, privateMode);
    if (await exists(target.markerPath)) {
      await requireFullInitialization(root);
      fail(
        "Full initialization already has a receipt; preserve it and reconcile evidence explicitly before replacing it.",
      );
    }
    if (await exists(target.acceptancePath))
      fail(
        "Existing public initialization evidence needs explicit reconciliation; preserve it before recording a new receipt.",
      );
    await atomic(target.acceptancePath, receipt, 0o644);
    await atomic(
      target.markerPath,
      {
        schemaVersion: 1,
        root: target.root,
        repository: target.name,
        sourceCommit: receipt.sourceCommit,
        digest: receipt.digest,
      },
      0o600,
    );
    return summary(target, receipt);
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}
async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!["require-complete", "complete"].includes(command))
    fail("Use require-complete or complete.");
  let root = defaultRoot;
  let inputPath;
  const seen = new Set();
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (
      !["--root", "--input"].includes(flag) ||
      seen.has(flag) ||
      !args[index + 1] ||
      args[index + 1].startsWith("--")
    )
      fail("Use --root PATH and --input FILE|- only for complete.");
    seen.add(flag);
    if (flag === "--root") root = resolve(args[++index]);
    else inputPath = args[++index];
  }
  let result;
  if (command === "require-complete") {
    if (inputPath) fail("require-complete is read-only and accepts no input.");
    result = await requireFullInitialization(root);
  } else {
    if (!inputPath)
      fail(
        "complete requires --input FILE|- with actual structured execution evidence.",
      );
    let input;
    if (inputPath === "-") {
      let bytes = "";
      for await (const chunk of process.stdin) {
        bytes += chunk;
        if (Buffer.byteLength(bytes) > 128 * 1024)
          fail("Completion input exceeds its bounded size.");
      }
      try {
        input = JSON.parse(bytes);
      } catch {
        fail("Invalid completion input JSON.");
      }
    } else input = await readJson(resolve(inputPath), true);
    result = await completeFullInitialization(root, input);
  }
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((error) => {
    const reason =
      error instanceof Error && !error.code && !error.cmd
        ? error.message
        : "Completion inspection failed; verify local consumer evidence and protected paths.";
    process.stderr.write(`${reason}\n${completionNext}\n`);
    process.exitCode = 1;
  });
