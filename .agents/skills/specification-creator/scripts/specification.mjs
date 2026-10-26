import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  readdir,
  rename,
  unlink,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const defaultRoot = resolve(here, "../../../..");
const next =
  "Finish full $initialization-execution before running $specification-creator.";
export const topicIds = Object.freeze([
  "problem",
  "users",
  "outcomes",
  "scope",
  "workflows",
  "features",
  "pages",
  "data",
  "permissions",
  "business_rules",
  "integrations",
  "notifications",
  "search_reporting",
  "import_export",
  "localization",
  "accessibility",
  "usage_performance",
  "privacy_retention",
  "migration",
  "visual_direction",
  "responsive_behavior",
  "constraints",
  "responsibilities",
  "acceptance",
]);
const essential = ["problem", "users", "outcomes", "scope", "acceptance"];
const sha = (value) => createHash("sha256").update(value).digest("hex");
const stable = (value) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
        )
      : v,
  );
const plain = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const fail = (message) => {
  throw new Error(message);
};
const id = (v) => typeof v === "string" && /^[a-z][a-z0-9_-]{0,79}$/.test(v);
const nonempty = (v) => typeof v === "string" && Boolean(v.trim());
const fileName = (v) =>
  typeof v === "string" && /^[A-Z][A-Z0-9-]*\.md$/.test(v);
function own(value, allowed) {
  if (!plain(value) || Object.keys(value).some((key) => !allowed.includes(key)))
    fail("Unsupported specification input properties.");
}
function secretCheck(value) {
  if (
    typeof value === "string" &&
    /-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})|\bBearer\s+\S+|:\/\/[^\s/@:]+:[^\s/@]+@/i.test(
      value,
    )
  )
    fail("Secret-like content rejected; retain protected references instead.");
  if (Array.isArray(value)) value.forEach(secretCheck);
  else if (plain(value)) Object.values(value).forEach(secretCheck);
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
async function safe(path, kind, privateMode = false) {
  const stat = await lstat(path);
  if (
    stat.isSymbolicLink() ||
    (kind === "directory" ? !stat.isDirectory() : !stat.isFile()) ||
    stat.uid !== process.getuid?.() ||
    (kind === "file" && stat.nlink !== 1)
  )
    fail(
      "Unsafe specification path; use user-owned regular files and directories without links.",
    );
  if (privateMode && stat.mode & 0o077)
    fail(
      "Specification state must use private permissions (0700 directories, 0600 files).",
    );
}
async function ensure(path, mode = 0o755) {
  if (!(await exists(path))) await mkdir(path, { mode });
  await safe(path, "directory", mode === 0o700);
}
async function atomic(path, bytes, mode = 0o600) {
  if (await exists(path)) await safe(path, "file", mode === 0o600);
  const temporary = join(dirname(path), `.specification-${randomUUID()}.tmp`);
  const handle = await open(
    temporary,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      constants.O_NOFOLLOW,
    mode,
  );
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
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
    await unlink(temporary).catch((e) => {
      if (e.code !== "ENOENT") throw e;
    });
  }
}
async function target(root) {
  // The sibling gate runs before consumer inspection, state reads or writes.
  let receipt;
  try {
    const { requireFullInitialization } = await import(
      pathToFileURL(
        join(
          resolve(root),
          ".agents/skills/initialization-execution/scripts/completion.mjs",
        ),
      )
    );
    if (typeof requireFullInitialization !== "function") fail(next);
    receipt = await requireFullInitialization(resolve(root));
  } catch {
    fail(
      `Full initialization is not complete or its completion helper is unavailable. ${next}`,
    );
  }
  if (
    receipt.scope !== "full" ||
    !nonempty(receipt.repository) ||
    !/^[a-f0-9]{64}$/.test(receipt.digest)
  )
    fail(next);
  root = resolve(root);
  if ((await realpath(root)) !== root)
    fail("Select the canonical consumer worktree path.");
  let parent = root;
  for (const segment of [".agents", "skills", "specification-creator"]) {
    parent = join(parent, segment);
    await safe(parent, "directory");
  }
  const directory = join(parent, "state");
  if (await exists(directory)) await safe(directory, "directory", true);
  const docsParent = join(root, "docs");
  if (await exists(docsParent)) await safe(docsParent, "directory");
  const documents = join(docsParent, "specification");
  if (await exists(documents)) await safe(documents, "directory");
  return {
    root,
    receipt,
    directory,
    path: join(directory, "interview.json"),
    documents,
  };
}
function shape(state) {
  own(state, [
    "schemaVersion",
    "repository",
    "initialization",
    "revision",
    "iteration",
    "topics",
    "questions",
    "sources",
    "documents",
    "approval",
    "changes",
  ]);
  own(state.repository, ["root", "name"]);
  own(state.initialization, ["digest", "sourceCommit"]);
  if (
    state.schemaVersion !== 1 ||
    !Number.isSafeInteger(state.revision) ||
    state.revision < 0 ||
    !Number.isSafeInteger(state.iteration) ||
    state.iteration < 1 ||
    !plain(state.topics) ||
    !plain(state.questions) ||
    !plain(state.sources) ||
    !plain(state.documents) ||
    !Array.isArray(state.changes)
  )
    fail("Invalid specification state.");
  if (
    Object.keys(state.topics).length !== topicIds.length ||
    topicIds.some((key) => !Object.hasOwn(state.topics, key))
  )
    fail("Invalid topic inventory.");
  for (const topic of Object.values(state.topics)) {
    own(topic, ["status", "rationale", "questionIds"]);
    if (
      !["unresolved", "addressed", "not_applicable"].includes(topic.status) ||
      !Array.isArray(topic.questionIds) ||
      !topic.questionIds.every(id) ||
      typeof topic.rationale !== "string"
    )
      fail("Invalid topic disposition.");
  }
  for (const [key, source] of Object.entries(state.sources)) {
    own(source, ["kind", "reference", "sha256"]);
    if (
      !id(key) ||
      !["file", "conversation"].includes(source.kind) ||
      !nonempty(source.reference) ||
      !/^[a-f0-9]{64}$/.test(source.sha256)
    )
      fail("Invalid source identity.");
  }
  for (const [key, question] of Object.entries(state.questions)) {
    own(question, [
      "topic",
      "prompt",
      "recommendation",
      "dependsOn",
      "status",
      "answer",
      "provenance",
      "sourceIds",
      "blocking",
      "decisionEvidence",
    ]);
    if (
      !id(key) ||
      !topicIds.includes(question.topic) ||
      !nonempty(question.prompt) ||
      !Array.isArray(question.dependsOn) ||
      !question.dependsOn.every(id) ||
      !Array.isArray(question.sourceIds) ||
      !question.sourceIds.every(id) ||
      typeof question.blocking !== "boolean" ||
      ![
        "unknown",
        "proposed",
        "answered",
        "deferred",
        "not_applicable",
      ].includes(question.status) ||
      !["user", "source", "proposal"].includes(question.provenance) ||
      (question.recommendation !== undefined &&
        typeof question.recommendation !== "string") ||
      (question.decisionEvidence !== undefined &&
        typeof question.decisionEvidence !== "string")
    )
      fail("Invalid question record.");
    if (question.status !== "unknown" && !nonempty(question.answer))
      fail("Record a nonempty answer, proposal or deferral rationale.");
    if (question.status === "answered" && question.provenance === "proposal")
      fail("An analyst proposal cannot be recorded as an answered question.");
    if (
      ["answered", "not_applicable"].includes(question.status) &&
      question.provenance === "user" &&
      !nonempty(question.decisionEvidence)
    )
      fail("Record the actual user decision evidence.");
    if (question.provenance === "source" && !question.sourceIds.length)
      fail("Source-derived answers need source references.");
    if (
      question.dependsOn.some((key) => !Object.hasOwn(state.questions, key)) ||
      question.sourceIds.some((key) => !Object.hasOwn(state.sources, key))
    )
      fail("Unknown question dependency or source reference.");
  }
  for (const [key, topic] of Object.entries(state.topics)) {
    if (
      topic.questionIds.some(
        (q) =>
          !Object.hasOwn(state.questions, q) ||
          state.questions[q].topic !== key,
      )
    )
      fail("Invalid topic question reference.");
  }
  const seen = new Set(),
    active = new Set();
  function visit(key) {
    if (active.has(key)) fail("Question dependency cycle.");
    if (seen.has(key)) return;
    active.add(key);
    state.questions[key].dependsOn.forEach(visit);
    active.delete(key);
    seen.add(key);
  }
  Object.keys(state.questions).forEach(visit);
  for (const [name, hash] of Object.entries(state.documents))
    if (!fileName(name) || !/^[a-f0-9]{64}$/.test(hash))
      fail("Invalid document manifest.");
  if (state.approval !== null) {
    own(state.approval, [
      "reviewedRevision",
      "approvedRevision",
      "confirmedAt",
      "response",
      "digest",
      "documents",
    ]);
    if (
      !Number.isSafeInteger(state.approval.reviewedRevision) ||
      state.approval.approvedRevision !== state.revision ||
      !nonempty(state.approval.response) ||
      !nonempty(state.approval.confirmedAt) ||
      !/^[a-f0-9]{64}$/.test(state.approval.digest) ||
      !plain(state.approval.documents)
    )
      fail("Invalid approval receipt.");
  }
  secretCheck(state);
}
const digest = (state) => sha(stable({ ...state, approval: null }));
async function load(t) {
  if (!(await exists(t.path))) return null;
  await safe(t.path, "file", true);
  let state;
  try {
    state = JSON.parse(await readFile(t.path, "utf8"));
  } catch {
    fail("Invalid specification JSON; preserve state and reconcile it.");
  }
  shape(state);
  if (
    state.repository.root !== t.root ||
    state.repository.name !== t.receipt.repository
  )
    fail("Specification state belongs to a different repository/worktree.");
  if (state.initialization.digest !== t.receipt.digest)
    fail(
      "Initialization completion identity changed; reconcile it explicitly before resuming this specification.",
    );
  return state;
}
async function manifest(t) {
  const result = {};
  if (!(await exists(t.documents))) return result;
  await safe(t.documents, "directory");
  for (const name of await readdir(t.documents)) {
    if (name === "versions") {
      await safe(join(t.documents, name), "directory");
      continue;
    }
    if (!fileName(name))
      fail(
        "Unexpected specification document; reconcile the document inventory.",
      );
    const path = join(t.documents, name);
    await safe(path, "file");
    result[name] = sha(await readFile(path));
  }
  return result;
}
const same = (a, b) => stable(a) === stable(b);
function assessment(state) {
  const settled = (key) =>
    ["answered", "not_applicable"].includes(state.questions[key].status);
  const unresolved = Object.keys(state.questions).filter(
    (key) => !settled(key),
  );
  const frontier = unresolved.filter((key) =>
    state.questions[key].dependsOn.every(settled),
  );
  const blockedQuestions = Object.keys(state.questions).filter((key) => {
    const q = state.questions[key];
    return (
      (q.blocking && !settled(key)) ||
      (settled(key) && !q.dependsOn.every(settled))
    );
  });
  const unresolvedTopics = topicIds.filter((key) => {
    const topic = state.topics[key];
    if (topic.status === "unresolved" || !nonempty(topic.rationale))
      return true;
    if (topic.status === "not_applicable")
      return (
        essential.includes(key) || topic.questionIds.some((q) => !settled(q))
      );
    return (
      !topic.questionIds.length || topic.questionIds.some((q) => !settled(q))
    );
  });
  return { frontier, blockedQuestions, unresolvedTopics };
}
async function report(state, t) {
  if (!state) return { exists: false, approved: false, statePath: t.path };
  const current = await manifest(t),
    a = assessment(state);
  const documentsCurrent = same(current, state.documents);
  const ready =
    !a.blockedQuestions.length &&
    !a.unresolvedTopics.length &&
    documentsCurrent &&
    Boolean(current["SPECIFICATION.md"]);
  const approved =
    ready &&
    Boolean(state.approval) &&
    state.approval.digest === digest(state) &&
    same(state.approval.documents, current);
  return {
    exists: true,
    statePath: t.path,
    revision: state.revision,
    iteration: state.iteration,
    ...a,
    documentsCurrent,
    documentHashes: state.documents,
    reviewDigest: digest(state),
    ready,
    approved,
  };
}
async function snapshot(state, t) {
  const versions = join(t.documents, "versions");
  await ensure(versions);
  const privatePath = join(
    t.directory,
    `approved-${String(state.iteration).padStart(3, "0")}.json`,
  );
  const directory = join(
    versions,
    `approved-${String(state.iteration).padStart(3, "0")}`,
  );
  if ((await exists(directory)) || (await exists(privatePath)))
    fail(
      "Approved version snapshot already exists; preserve it and reconcile the interrupted operation.",
    );
  await atomic(privatePath, JSON.stringify(state, null, 2) + "\n");
  await mkdir(directory, { mode: 0o755 });
  for (const name of Object.keys(state.documents)) {
    await atomic(
      join(directory, name),
      await readFile(join(t.documents, name)),
      0o644,
    );
  }
  await atomic(
    join(directory, "approval.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        repository: state.repository.name,
        revision: state.revision,
        digest: state.approval.digest,
        confirmedAt: state.approval.confirmedAt,
        documents: state.documents,
      },
      null,
      2,
    ) + "\n",
    0o644,
  );
}
async function verifySnapshot(state, t) {
  const privatePath = join(
    t.directory,
    `approved-${String(state.iteration).padStart(3, "0")}.json`,
  );
  await safe(privatePath, "file", true);
  let retained;
  try {
    retained = JSON.parse(await readFile(privatePath, "utf8"));
  } catch {
    fail("Private approved interview snapshot is unreadable.");
  }
  if (
    digest(retained) !== state.approval.digest ||
    !same(retained.approval, state.approval)
  )
    fail("Private approved interview snapshot changed.");
  const directory = join(
    t.documents,
    "versions",
    `approved-${String(state.iteration).padStart(3, "0")}`,
  );
  await safe(join(t.documents, "versions"), "directory");
  await safe(directory, "directory");
  await safe(join(directory, "approval.json"), "file");
  let receipt;
  try {
    receipt = JSON.parse(
      await readFile(join(directory, "approval.json"), "utf8"),
    );
  } catch {
    fail("Approved version receipt is unreadable.");
  }
  if (
    receipt.digest !== state.approval.digest ||
    !same(receipt.documents, state.approval.documents)
  )
    fail("Approved version receipt changed.");
  const names = await readdir(directory);
  if (
    !same(
      names.sort(),
      [...Object.keys(state.approval.documents), "approval.json"].sort(),
    )
  )
    fail("Approved version inventory changed.");
  for (const [name, expected] of Object.entries(state.approval.documents)) {
    await safe(join(directory, name), "file");
    if (sha(await readFile(join(directory, name))) !== expected)
      fail("Approved version contents changed; preserve and reconcile them.");
  }
}
export async function run(command, { root = defaultRoot, input } = {}) {
  if (
    ![
      "init",
      "status",
      "save",
      "validate",
      "approve",
      "require-approved",
      "revise",
    ].includes(command)
  )
    fail(
      "Use init, status, save, validate, approve, require-approved or revise.",
    );
  const t = await target(root);
  if (["status", "validate", "require-approved"].includes(command)) {
    const state = await load(t),
      result = await report(state, t);
    if (command === "validate" && !result.ready)
      fail(
        "Specification is incomplete or its document manifest changed; inspect status for unresolved IDs.",
      );
    if (command === "require-approved") {
      if (!result.approved)
        fail(
          "Specification is not approved for its current state and exact documents; resume $specification-creator.",
        );
      await verifySnapshot(state, t);
    }
    return result;
  }
  await ensure(t.directory, 0o700);
  const lockPath = join(t.directory, ".write-lock");
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
        "Another specification writer or interrupted lock exists; inspect it before retrying.",
      );
    throw e;
  }
  try {
    let state = await load(t);
    if (command === "init") {
      if (state) return report(state, t);
      if (Object.keys(await manifest(t)).length)
        fail(
          "Existing specification documents need explicit adoption; preserve them as sources rather than overwrite them.",
        );
      state = {
        schemaVersion: 1,
        repository: { root: t.root, name: t.receipt.repository },
        initialization: {
          digest: t.receipt.digest,
          sourceCommit: t.receipt.sourceCommit,
        },
        revision: 0,
        iteration: 1,
        topics: Object.fromEntries(
          topicIds.map((key) => [
            key,
            { status: "unresolved", rationale: "", questionIds: [] },
          ]),
        ),
        questions: {},
        sources: {},
        documents: {},
        approval: null,
        changes: [],
      };
    } else {
      if (!state)
        fail(
          "No saved specification interview; start $specification-creator first.",
        );
      own(
        input,
        command === "save"
          ? [
              "expectedRevision",
              "topics",
              "questions",
              "sources",
              "documents",
              "adoptDocuments",
            ]
          : command === "approve"
            ? [
                "expectedRevision",
                "reviewedDigest",
                "reviewedDocuments",
                "confirmation",
              ]
            : ["expectedRevision", "affectedQuestionIds", "reason"],
      );
      secretCheck(input);
      if (input.expectedRevision !== state.revision)
        fail(
          "Specification revision conflict; reload saved state and merge the answer batch.",
        );
      if (command === "save") {
        if (state.approval)
          fail("An approved specification requires revise before changes.");
        for (const key of ["topics", "questions", "sources", "documents"])
          if (input[key] !== undefined && !plain(input[key]))
            fail("Specification patches must be objects.");
        if (
          input.adoptDocuments !== undefined &&
          typeof input.adoptDocuments !== "boolean"
        )
          fail("Invalid document adoption choice.");
        for (const [key, source] of Object.entries(input.sources ?? {})) {
          if (
            Object.hasOwn(state.sources, key) &&
            !same(source, state.sources[key])
          )
            fail(
              "Source identities are immutable; add a new source ID and review its affected requirements.",
            );
        }
        const current = await manifest(t);
        if (input.adoptDocuments && input.documents !== undefined)
          fail(
            "Adopt manual edits in a separate save before producing further changes.",
          );
        if (!input.adoptDocuments && !same(current, state.documents))
          fail(
            "Documents changed outside the helper; preserve manual edits and explicitly adopt them before further writes.",
          );
        const documents = {
          ...(input.adoptDocuments ? current : state.documents),
        };
        for (const [name, content] of Object.entries(input.documents ?? {})) {
          if (!fileName(name) || !nonempty(content))
            fail(
              "Use nonempty Markdown documents with uppercase simple filenames.",
            );
          documents[name] = sha(content);
        }
        const previous = state;
        state = {
          ...state,
          revision: state.revision + 1,
          topics: { ...state.topics, ...input.topics },
          questions: { ...state.questions, ...input.questions },
          sources: { ...state.sources, ...input.sources },
          documents,
        };
        shape(state);
        const changed = new Set(
          Object.keys(input.questions ?? {}).filter((key) => {
            const old = previous.questions[key];
            return (
              old &&
              ["answered", "not_applicable"].includes(old.status) &&
              !same(old, state.questions[key])
            );
          }),
        );
        const affected = new Set(changed);
        let expanded = true;
        while (expanded) {
          expanded = false;
          for (const [key, question] of Object.entries(state.questions)) {
            if (
              !affected.has(key) &&
              question.dependsOn.some((dependency) => affected.has(dependency))
            ) {
              affected.add(key);
              expanded = true;
            }
          }
        }
        for (const key of affected) {
          const question = state.questions[key];
          state.topics[question.topic] = {
            ...state.topics[question.topic],
            status: "unresolved",
          };
          const oldTopic = previous.questions[key]?.topic;
          if (oldTopic)
            state.topics[oldTopic] = {
              ...state.topics[oldTopic],
              status: "unresolved",
            };
          // Dependent answers need a later round after their changed prerequisite.
          if (
            question.dependsOn.some((dependency) => affected.has(dependency))
          ) {
            state.questions[key] = {
              ...question,
              status: "unknown",
              provenance: "proposal",
            };
            delete state.questions[key].answer;
            delete state.questions[key].decisionEvidence;
          }
        }
        if (input.documents) {
          await ensure(join(t.root, "docs"));
          await ensure(t.documents);
          for (const [name, content] of Object.entries(input.documents))
            await atomic(join(t.documents, name), content, 0o644);
        }
      } else if (command === "approve") {
        if (
          input.reviewedDigest !== digest(state) ||
          !same(input.reviewedDocuments, state.documents)
        )
          fail(
            "Approval must identify the exact reviewed state digest and document hashes.",
          );
        own(input.confirmation, ["response"]);
        if (
          !nonempty(input.confirmation.response) ||
          input.confirmation.response.length > 10000
        )
          fail(
            "Record the actual human response approving the reviewed specification revision.",
          );
        if (state.approval)
          fail(
            "Specification already has approval; use require-approved or start a revision.",
          );
        if (!(await report(state, t)).ready)
          fail(
            "Resolve all applicable topics, blocking questions and document changes before approval.",
          );
        const reviewedRevision = state.revision;
        state = { ...state, revision: state.revision + 1 };
        state.approval = {
          reviewedRevision,
          approvedRevision: state.revision,
          confirmedAt: new Date().toISOString(),
          response: input.confirmation.response,
          digest: digest(state),
          documents: { ...state.documents },
        };
        await snapshot(state, t);
      } else {
        if (!state.approval || state.approval.digest !== digest(state))
          fail(
            "An intact prior approval is required to start an approved-specification revision.",
          );
        await verifySnapshot(state, t);
        if (
          !Array.isArray(input.affectedQuestionIds) ||
          !input.affectedQuestionIds.length ||
          input.affectedQuestionIds.some(
            (key) => !id(key) || !Object.hasOwn(state.questions, key),
          ) ||
          !nonempty(input.reason)
        )
          fail("Identify affected question IDs and the actual change request.");
        const affected = new Set(input.affectedQuestionIds);
        let expanded = true;
        while (expanded) {
          expanded = false;
          for (const [key, q] of Object.entries(state.questions))
            if (
              !affected.has(key) &&
              q.dependsOn.some((dep) => affected.has(dep))
            ) {
              affected.add(key);
              expanded = true;
            }
        }
        const questions = { ...state.questions },
          topics = { ...state.topics };
        for (const key of affected) {
          questions[key] = {
            ...questions[key],
            status: "unknown",
            provenance: "proposal",
          };
          delete questions[key].answer;
          delete questions[key].decisionEvidence;
          topics[questions[key].topic] = {
            ...topics[questions[key].topic],
            status: "unresolved",
          };
        }
        state = {
          ...state,
          revision: state.revision + 1,
          iteration: state.iteration + 1,
          questions,
          topics,
          documents: await manifest(t),
          approval: null,
          changes: [
            ...state.changes,
            {
              fromIteration: state.iteration,
              reason: input.reason,
              affectedQuestionIds: [...affected].sort(),
            },
          ],
        };
      }
    }
    shape(state);
    await atomic(t.path, JSON.stringify(state, null, 2) + "\n");
    return report(state, t);
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}
async function main() {
  const [command, ...args] = process.argv.slice(2);
  let root = defaultRoot,
    inputPath;
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (!["--root", "--input"].includes(flag) || seen.has(flag) || !args[i + 1])
      fail("Use --root PATH and optional --input FILE (or - for stdin).");
    seen.add(flag);
    if (flag === "--root") root = resolve(args[++i]);
    else inputPath = args[++i];
  }
  // Gate before reading private answer input, not only before applying it.
  await target(root);
  if (
    inputPath &&
    ["init", "status", "validate", "require-approved"].includes(command)
  )
    fail("This command accepts no input.");
  let input;
  if (inputPath) {
    let bytes = "";
    if (inputPath === "-")
      for await (const chunk of process.stdin) bytes += chunk;
    else {
      await safe(resolve(inputPath), "file", true);
      bytes = await readFile(inputPath, "utf8");
    }
    try {
      input = JSON.parse(bytes);
    } catch {
      fail("Invalid JSON input; values were not echoed.");
    }
  }
  process.stdout.write(
    JSON.stringify(await run(command, { root, input }), null, 2) + "\n",
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((error) => {
    process.stderr.write(
      (error instanceof Error && !error.code && !error.cmd
        ? error.message
        : "Local specification operation failed; preserve state and inspect protected files.") +
        "\n",
    );
    process.exitCode = 1;
  });
