import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  unlink,
} from "node:fs/promises";
import { dirname, join, parse, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const defaultRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);
export const canonical = (value) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
        )
      : v,
  );
export const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");
const fail = (message) => {
  throw new Error(message);
};
const plain = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const text = (v) => typeof v === "string" && Boolean(v.trim());
const hash = (v) => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const docName = (v) => typeof v === "string" && /^[A-Z][A-Z0-9-]*\.md$/.test(v);
const id = (v) => typeof v === "string" && /^[A-Z][A-Z0-9_-]{0,79}$/.test(v);
const repository = (v) =>
  typeof v === "string" && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(v);
function keys(value, expected, label) {
  if (
    !plain(value) ||
    canonical(Object.keys(value).sort()) !== canonical([...expected].sort())
  )
    fail(`Invalid ${label} properties.`);
}
function unique(values, label) {
  if (!Array.isArray(values) || new Set(values).size !== values.length)
    fail(`Invalid or duplicate ${label}.`);
}
function sanitized(value) {
  if (
    /-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})|\bBearer\s+\S+|:\/\/[^\s/@:]+:[^\s/@]+@/i.test(
      value,
    )
  )
    fail("Secret-like package content; retain protected references instead.");
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
async function safe(path, kind) {
  const stat = await lstat(path);
  if (
    stat.isSymbolicLink() ||
    (kind === "directory" ? !stat.isDirectory() : !stat.isFile()) ||
    (kind === "file" && stat.nlink !== 1)
  )
    fail(
      "Unsafe package path: use regular files and directories without links.",
    );
}
async function ancestors(path) {
  path = resolve(path);
  let current = parse(path).root;
  for (const segment of path.slice(current.length).split("/").filter(Boolean)) {
    current = join(current, segment);
    if (await exists(current)) await safe(current, "directory");
  }
}
async function read(path) {
  await safe(path, "file");
  return readFile(path, "utf8");
}
async function json(path) {
  const contents = await read(path);
  try {
    return JSON.parse(contents);
  } catch {
    fail("Invalid issue-package JSON; inspect the selected file locally.");
  }
}
async function inventory(path, expected) {
  await safe(path, "directory");
  if (
    canonical((await readdir(path)).sort()) !== canonical([...expected].sort())
  )
    fail(`Unexpected file inventory in ${path}.`);
}
async function atomic(path, value) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  const handle = await open(
    temporary,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      constants.O_NOFOLLOW,
    0o644,
  );
  try {
    await handle.writeFile(value);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename(temporary, path);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}
async function currentSource(root) {
  root = resolve(root);
  const helper = join(
    root,
    ".agents/skills/specification-creator/scripts/specification.mjs",
  );
  let approved;
  try {
    await ancestors(dirname(helper));
    await safe(helper, "file");
    const { run } = await import(pathToFileURL(helper).href);
    approved = await run("require-approved", { root });
  } catch (error) {
    fail(
      `Specification is not complete and approved. Finish $specification-creator before preparing issues. ${error.message}`,
    );
  }
  const directory = join(
    root,
    "docs/specification/versions",
    `approved-${String(approved.iteration).padStart(3, "0")}`,
  );
  await ancestors(directory);
  const receipt = await json(join(directory, "approval.json"));
  checkReceipt(receipt);
  const { requireFullInitialization } = await import(
    pathToFileURL(
      join(
        root,
        ".agents/skills/initialization-execution/scripts/completion.mjs",
      ),
    ).href
  );
  const initialization = await requireFullInitialization(root);
  if (
    receipt.repository !== initialization.repository ||
    receipt.revision !== approved.revision ||
    receipt.digest !== approved.reviewDigest ||
    canonical(receipt.documents) !== canonical(approved.documentHashes)
  )
    fail("Approved specification receipt does not match the current approval.");
  const documents = {};
  for (const [name, expected] of Object.entries(receipt.documents)) {
    documents[name] = await read(join(directory, name));
    if (sha256(documents[name]) !== expected)
      fail("Approved specification snapshot changed.");
    sanitized(documents[name]);
  }
  return {
    receipt,
    receiptText: await read(join(directory, "approval.json")),
    documents,
    iteration: approved.iteration,
  };
}
function checkReceipt(receipt) {
  keys(
    receipt,
    [
      "schemaVersion",
      "repository",
      "revision",
      "digest",
      "confirmedAt",
      "documents",
    ],
    "public approval receipt",
  );
  if (
    receipt.schemaVersion !== 1 ||
    !repository(receipt.repository) ||
    !Number.isSafeInteger(receipt.revision) ||
    receipt.revision < 1 ||
    !hash(receipt.digest) ||
    !text(receipt.confirmedAt) ||
    !Number.isFinite(Date.parse(receipt.confirmedAt)) ||
    !plain(receipt.documents) ||
    !receipt.documents["SPECIFICATION.md"] ||
    Object.entries(receipt.documents).some(
      ([name, digest]) => !docName(name) || !hash(digest),
    )
  )
    fail("Invalid public specification approval receipt.");
}
function graph(issues, field) {
  const map = new Map(issues.map((issue) => [issue.id, issue]));
  const visiting = new Set(),
    visited = new Set();
  function visit(key) {
    if (visiting.has(key)) fail(`Cycle in issue ${field} graph.`);
    if (visited.has(key)) return;
    visiting.add(key);
    const issue = map.get(key);
    for (const next of field === "dependsOn"
      ? issue.dependsOn
      : issue.parent
        ? [issue.parent]
        : []) {
      if (!map.has(next) || next === key)
        fail(`Unknown or self-referencing ${field}.`);
      visit(next);
    }
    visiting.delete(key);
    visited.add(key);
  }
  for (const issue of issues) visit(issue.id);
}
function bodySections(body) {
  for (const heading of [
    "Outcome",
    "Scope",
    "Acceptance criteria",
    "Verification",
    "Decisions",
    "Source",
    "Dependencies",
  ]) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const section = body.match(
      new RegExp(
        `^## ${escaped}\\s*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`,
        "m",
      ),
    );
    if (!section || !section[1].trim())
      fail(`Issue body needs a nonempty ${heading} section.`);
  }
}
async function inspect(
  packageDir,
  { root, requireCurrentSource = Boolean(root), sealing = false } = {},
) {
  if (!text(packageDir)) fail("Provide --package DIR.");
  packageDir = resolve(packageDir);
  await ancestors(packageDir);
  await inventory(packageDir, [
    "manifest.json",
    "README.md",
    "source",
    "issues",
    ...(sealing ? [".package-write-lock"] : []),
  ]);
  await read(join(packageDir, "README.md"));
  const manifest = await json(join(packageDir, "manifest.json"));
  keys(
    manifest,
    [
      "schemaVersion",
      "packageId",
      "repository",
      "source",
      "labels",
      "issues",
      "packageDigest",
    ],
    "issue manifest",
  );
  if (
    manifest.schemaVersion !== 1 ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      manifest.packageId,
    ) ||
    !repository(manifest.repository)
  )
    fail("Invalid package identity or repository.");
  keys(
    manifest.source,
    ["iteration", "revision", "digest", "documents"],
    "source identity",
  );
  if (
    !Number.isSafeInteger(manifest.source.iteration) ||
    manifest.source.iteration < 1
  )
    fail("Invalid source iteration.");
  const sourceReceipt = await json(join(packageDir, "source/approval.json"));
  checkReceipt(sourceReceipt);
  if (
    manifest.repository !== sourceReceipt.repository ||
    manifest.source.revision !== sourceReceipt.revision ||
    manifest.source.digest !== sourceReceipt.digest ||
    canonical(manifest.source.documents) !== canonical(sourceReceipt.documents)
  )
    fail("Package source identity and public approval receipt disagree.");
  await inventory(join(packageDir, "source"), [
    "approval.json",
    ...Object.keys(sourceReceipt.documents),
  ]);
  const documents = {};
  for (const [name, expected] of Object.entries(sourceReceipt.documents)) {
    documents[name] = await read(join(packageDir, "source", name));
    if (sha256(documents[name]) !== expected)
      fail("Copied approved source hash mismatch.");
    sanitized(documents[name]);
  }
  if (!Array.isArray(manifest.labels) || !manifest.labels.length)
    fail("Include explicit label definitions.");
  const labelNames = [];
  for (const label of manifest.labels) {
    keys(label, ["name", "color", "description"], "label definition");
    if (
      !text(label.name) ||
      label.name.length > 50 ||
      !/^[a-fA-F0-9]{6}$/.test(label.color) ||
      !text(label.description) ||
      label.description.length > 100
    )
      fail("Invalid label definition.");
    labelNames.push(label.name);
  }
  unique(labelNames, "label definitions");
  if (!Array.isArray(manifest.issues) || !manifest.issues.length)
    fail("Package is a draft: author at least one issue before sealing.");
  unique(
    manifest.issues.map((issue) => issue.id),
    "issue IDs",
  );
  const issues = [];
  for (const issue of manifest.issues) {
    keys(
      issue,
      [
        "id",
        "kind",
        "owner",
        "title",
        "body",
        "sha256",
        "labels",
        "sourceRefs",
        "dependsOn",
        "parent",
      ],
      "issue metadata",
    );
    if (
      !id(issue.id) ||
      !["epic", "task"].includes(issue.kind) ||
      !text(issue.owner) ||
      !text(issue.title) ||
      issue.title.length > 256 ||
      issue.body !== `issues/${issue.id}.md` ||
      (issue.parent !== null && !id(issue.parent))
    )
      fail("Invalid issue identity, ownership or body path.");
    unique(issue.labels, "issue labels");
    if (
      !issue.labels.length ||
      issue.labels.some((name) => !labelNames.includes(name))
    )
      fail("Issue label lacks a package definition.");
    unique(issue.dependsOn, "issue dependencies");
    if (issue.dependsOn.some((dependency) => !id(dependency)))
      fail("Invalid dependency identity.");
    if (!Array.isArray(issue.sourceRefs) || !issue.sourceRefs.length)
      fail("Every issue needs approved source references.");
    unique(issue.sourceRefs.map(canonical), "source references");
    for (const ref of issue.sourceRefs) {
      keys(ref, ["document", "id"], "source reference");
      if (
        !docName(ref.document) ||
        !Object.hasOwn(documents, ref.document) ||
        typeof ref.id !== "string" ||
        !/^[A-Za-z][A-Za-z0-9_-]{0,99}$/.test(ref.id)
      )
        fail("Invalid approved source reference.");
      const token = ref.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (
        !new RegExp(`(?<![A-Za-z0-9_-])${token}(?![A-Za-z0-9_-])`).test(
          documents[ref.document],
        )
      )
        fail("Referenced requirement ID is absent from approved source.");
    }
    const bodyText = await read(join(packageDir, issue.body));
    sanitized(bodyText);
    bodySections(bodyText);
    if (bodyText.includes("<!-- issue-package"))
      fail("Issue body contains a reserved import marker.");
    const digest = sha256(bodyText);
    if (!sealing && (!hash(issue.sha256) || issue.sha256 !== digest))
      fail(
        "Issue body hash mismatch; review edits and deliberately seal the package again.",
      );
    issues.push({ ...issue, sha256: digest, bodyText });
  }
  await inventory(
    join(packageDir, "issues"),
    manifest.issues.map((issue) => `${issue.id}.md`),
  );
  graph(issues, "dependsOn");
  graph(issues, "parent");
  const normalized = {
    ...manifest,
    issues: issues.map(({ bodyText: _body, ...metadata }) => metadata),
  };
  const { packageDigest: _previous, ...content } = normalized;
  const packageDigest = sha256(canonical(content));
  if (
    !sealing &&
    (!hash(manifest.packageDigest) || manifest.packageDigest !== packageDigest)
  )
    fail(
      "Package digest mismatch; review changes and deliberately seal again.",
    );
  if (requireCurrentSource) {
    if (!root)
      fail(
        "A consumer root is required to check current specification approval.",
      );
    const current = await currentSource(root);
    if (
      current.iteration !== manifest.source.iteration ||
      canonical(current.receipt) !== canonical(sourceReceipt)
    )
      fail(
        "Package is stale or belongs to another specification. Preserve it and prepare a fresh package.",
      );
  }
  sanitized(JSON.stringify(manifest));
  return {
    manifest: { ...normalized, packageDigest },
    packageDigest,
    issues,
    sourceReceipt,
  };
}

export async function loadPackage(packageDir, options = {}) {
  return inspect(packageDir, options);
}
export async function run(command, { root, output, packageDir } = {}) {
  const consumerRoot = root ?? defaultRoot;
  if (command === "prepare") {
    const source = await currentSource(consumerRoot);
    if (!output) fail("Provide --output for the new issue package.");
    output = resolve(output);
    await ancestors(dirname(output));
    if (await exists(output))
      fail(
        "Output already exists; preserve human edits and use another output folder.",
      );
    await mkdir(dirname(output), { recursive: true });
    await mkdir(output);
    await mkdir(join(output, "source"));
    await mkdir(join(output, "issues"));
    for (const [name, contents] of Object.entries(source.documents))
      await atomic(join(output, "source", name), contents);
    await atomic(join(output, "source/approval.json"), source.receiptText);
    const manifest = {
      schemaVersion: 1,
      packageId: randomUUID(),
      repository: source.receipt.repository,
      source: {
        iteration: source.iteration,
        revision: source.receipt.revision,
        digest: source.receipt.digest,
        documents: source.receipt.documents,
      },
      labels: [
        {
          name: "needs-triage",
          color: "D4C5F9",
          description: "Maintainer evaluation needed",
        },
      ],
      issues: [],
      packageDigest: null,
    };
    await atomic(
      join(output, "manifest.json"),
      JSON.stringify(manifest, null, 2) + "\n",
    );
    await atomic(
      join(output, "README.md"),
      `# Issue package\n\nDRAFT until authored and sealed.\n\nRepository: ${manifest.repository}\nApproved specification iteration: ${manifest.source.iteration}\nApproved revision: ${manifest.source.revision}\n\nReview manifest.json and issues/. source/ retains only the public approved snapshot.\n\nSeal with specification-to-issues, then use github-issues-import to preview or import. Local preparation creates no GitHub issues.\n`,
    );
    return {
      output,
      packageId: manifest.packageId,
      source: manifest.source,
      status: "draft",
    };
  }
  if (!packageDir) fail("Provide --package DIR.");
  if (command === "validate") {
    const result = await loadPackage(packageDir, {
      root,
      requireCurrentSource: Boolean(root),
    });
    return {
      packageDigest: result.packageDigest,
      issueCount: result.issues.length,
      repository: result.manifest.repository,
    };
  }
  if (command !== "seal") fail("Use prepare, seal or validate.");
  // Recheck approval before creating even the local write lock.
  await currentSource(consumerRoot);
  await ancestors(packageDir);
  const lockPath = join(resolve(packageDir), ".package-write-lock");
  let handle;
  try {
    handle = await open(
      lockPath,
      constants.O_WRONLY |
        constants.O_CREAT |
        constants.O_EXCL |
        constants.O_NOFOLLOW,
      0o600,
    );
  } catch (error) {
    if (error.code === "EEXIST")
      fail(
        "Package writer or interrupted lock exists; inspect before retrying.",
      );
    throw error;
  }
  try {
    const result = await inspect(packageDir, {
      root: consumerRoot,
      requireCurrentSource: true,
      sealing: true,
    });
    await atomic(
      join(resolve(packageDir), "manifest.json"),
      JSON.stringify(result.manifest, null, 2) + "\n",
    );
    return {
      packageDigest: result.packageDigest,
      issueCount: result.issues.length,
      repository: result.manifest.repository,
    };
  } finally {
    await handle.close();
    await unlink(lockPath);
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const [command, ...args] = process.argv.slice(2),
      options = {};
    const supported = {
      "--root": "root",
      "--output": "output",
      "--package": "packageDir",
    };
    for (let index = 0; index < args.length; index += 2) {
      if (
        !supported[args[index]] ||
        !args[index + 1] ||
        args[index + 1].startsWith("--") ||
        options[supported[args[index]]]
      )
        fail(
          "Use prepare --root ROOT --output DIR, seal --root ROOT --package DIR, or validate --package DIR [--root ROOT].",
        );
      options[supported[args[index]]] = args[index + 1];
    }
    // Standalone validation intentionally supports a portable copied package.
    if (command === "validate" && !options.root) {
      const result = await loadPackage(options.packageDir);
      console.log(
        JSON.stringify({
          packageDigest: result.packageDigest,
          issueCount: result.issues.length,
          repository: result.manifest.repository,
        }),
      );
    } else console.log(JSON.stringify(await run(command, options)));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
